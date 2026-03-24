from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import sqlite3
import cv2
import numpy as np
import json
import secrets
import os

# New security imports
from passlib.context import CryptContext
import jwt
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configurações de Segurança do .env
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-for-dev-only")
ALGORITHM = "HS256"
import shutil
VERCEL_ENV = os.environ.get("VERCEL") == "1"

if VERCEL_ENV:
    temp_db_path = "/tmp/ponto.db"
    original_db = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend_data", "ponto.db")
    if not os.path.exists(temp_db_path) and os.path.exists(original_db):
        shutil.copy2(original_db, temp_db_path)
    DB_PATH = temp_db_path
else:
    DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend_data", "ponto.db"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Permite que o React se comunique com o Python - Agora restrito
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()

# Configurações do OpenCV
recognizer = cv2.face.LBPHFaceRecognizer_create()
modelo_treinado = False

# Coordenada Mock da "Matriz" da Empresa para validação de Geolocation
COMPANY_LAT = -23.550520 # Exemplo: São Paulo Centro
COMPANY_LNG = -46.633308


def testar_distancia(lat1, lon1, lat2, lon2):
    """Calcula a distância (Em Metros) usando a fórmula de Haversine."""
    import math
    R = 6371e3 # Raio da terra em metros
    phi1 = lat1 * math.pi/180
    phi2 = lat2 * math.pi/180
    delta_phi = (lat2-lat1) * math.pi/180
    delta_lambda = (lon2-lon1) * math.pi/180

    a = math.sin(delta_phi/2) * math.sin(delta_phi/2) + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda/2) * math.sin(delta_lambda/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def criar_token_jwt(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=12) # Token válido por 12 horas
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirou. Faça login novamente.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido.")

def verificar_admin(payload: dict = Depends(verificar_token)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado: Requer privilégios de Admin.")
    return payload


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tabela de usuários: Agora salva o Hashed Code em vez do código limpo
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            codigo_hash TEXT,
            senha_hash TEXT,
            cpf TEXT,
            email TEXT,
            face_data TEXT
        )
    ''')
    
    # Check if senha_hash column exists (for migrations)
    cursor.execute("PRAGMA table_info(usuarios)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'senha_hash' not in columns:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN senha_hash TEXT")
    
    # Tabela de registros: Agora salva lat e lng
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            data_hora TEXT,
            tipo TEXT,
            lat REAL,
            lng REAL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    ''')
    
    # Adicionar o Admin caso não exista ou atualizar senha se for a padrão do Mock
    cursor.execute("SELECT id, senha_hash FROM usuarios WHERE email = 'admin@pontoe.com'")
    admin_row = cursor.fetchone()
    
    env_admin_pass = os.getenv("ADMIN_PASSWORD", "RHadmin@")
    
    if not admin_row:
        senha_admin_hash = get_password_hash(env_admin_pass)
        cursor.execute("INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)", 
                      ("Administrador RH", "admin@pontoe.com", senha_admin_hash))
    elif not admin_row[1]: # Se existir mas sem senha_hash (migração)
        senha_admin_hash = get_password_hash(env_admin_pass)
        cursor.execute("UPDATE usuarios SET senha_hash = ? WHERE id = ?", (senha_admin_hash, admin_row[0]))
        
    conn.commit()
    conn.close()

def treinar_modelo():
    global modelo_treinado
    if not os.path.exists(DB_PATH):
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, face_data FROM usuarios WHERE face_data IS NOT NULL')
    rows = cursor.fetchall()
    conn.close()
    
    faces = []
    labels = []
    for uid, face_json in rows:
        try:
            face_arr = np.array(json.loads(face_json), dtype=np.uint8)
            faces.append(face_arr)
            labels.append(uid)
        except:
            pass
            
    if faces and len(faces) > 0:
        recognizer.train(faces, np.array(labels))
        modelo_treinado = True
    else:
        modelo_treinado = False

@app.on_event("startup")
def startup_event():
    init_db()
    treinar_modelo()

def extrair_face(image_bytes: bytes):
    """Extrai o rosto de uma imagem em bytes e retorna um array numpy (200x200 em escala de cinza)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None: return None
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    rostos = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
    if len(rostos) == 0: return None
        
    x, y, w, h = rostos[0]
    face_roi = gray[y:y+h, x:x+w]
    return cv2.resize(face_roi, (200, 200))


def processar_ponto(usuario_id: int, lat: float=None, lng: float=None):
    """Máquina de estados para bater ponto."""
    # Analise de Fraude / Geolocation
    if lat and lng:
        # Check distance
        distancia_metros = testar_distancia(float(lat), float(lng), COMPANY_LAT, COMPANY_LNG)
        # Limite ficticio de 500 metros
        if distancia_metros > 500:
            pass
            # Em um app real, lançaríamos exceção. Estamos permitindo passar para testes locais com a seguinte nota:
            print(f"ALERTA DE FRAUDE: Usuário {usuario_id} bateu ponto a {distancia_metros:.0f} metros de distância.")

    agora = datetime.now()
    agora_str = agora.strftime("%Y-%m-%d %H:%M:%S")
    limite = (agora - timedelta(hours=16)).strftime("%Y-%m-%d %H:%M:%S")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT nome FROM usuarios WHERE id = ?', (usuario_id,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    nome = user_row[0]
    
    cursor.execute('''
        SELECT tipo FROM registros 
        WHERE usuario_id = ? AND data_hora > ? 
        ORDER BY data_hora DESC LIMIT 1
    ''', (usuario_id, limite))
    
    resultado = cursor.fetchone()
    ultimo_tipo = resultado[0] if resultado else None

    if not ultimo_tipo or ultimo_tipo == 'SAIDA': novo_tipo = 'ENTRADA'
    elif ultimo_tipo == 'ENTRADA': novo_tipo = 'SAIDA_ALMOCO'
    elif ultimo_tipo == 'SAIDA_ALMOCO': novo_tipo = 'RETORNO_ALMOCO'
    else: novo_tipo = 'SAIDA'

    cursor.execute('INSERT INTO registros (usuario_id, data_hora, tipo, lat, lng) VALUES (?, ?, ?, ?, ?)',
                   (usuario_id, agora_str, novo_tipo, lat, lng))
    conn.commit()
    conn.close()

    return {"status": "sucesso", "nome": nome, "tipo": novo_tipo, "horario": agora_str}


@app.post("/api/login")
async def login(senha: str = Form(...)):
    # Agora verifica o hash da senha administrativa no banco de dados
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT senha_hash FROM usuarios WHERE email = 'admin@pontoe.com'")
    row = cursor.fetchone()
    conn.close()

    if row and verify_password(senha, row[0]):
        token = criar_token_jwt({"sub": "admin", "role": "admin"})
        return {"access_token": token, "token_type": "bearer"}
    
    raise HTTPException(status_code=401, detail="Senha administrativa incorreta")


@app.post("/api/primeiro-acesso")
async def primeiro_acesso(identificador: str = Form(...), nova_senha: str = Form(...)):
    """Define a senha para o primeiro acesso usando Email ou CPF."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM usuarios WHERE email = ? OR cpf = ?", (identificador, identificador))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado com este identificador.")
    
    senha_hash = get_password_hash(nova_senha)
    cursor.execute("UPDATE usuarios SET senha_hash = ? WHERE id = ?", (senha_hash, user[0]))
    conn.commit()
    conn.close()
    
    return {"status": "sucesso", "mensagem": "Senha configurada com sucesso. Agora você pode logar."}


@app.post("/api/login-usuario")
async def login_usuario(identificador: str = Form(...), senha: str = Form(...)):
    """Login para funcionários verem seu histórico."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, senha_hash, nome FROM usuarios WHERE email = ? OR cpf = ?", (identificador, identificador))
    user = cursor.fetchone()
    conn.close()

    if not user or not user[1] or not verify_password(senha, user[1]):
         raise HTTPException(status_code=401, detail="Identificador ou Senha inválidos.")
    
    token = criar_token_jwt({"sub": str(user[0]), "role": "user", "nome": user[2]})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/me/historico")
async def get_me_historico(user: dict = Depends(verificar_token)):
    """Retorna o histórico do próprio usuário logado."""
    usuario_id = int(user["sub"])
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT data_hora, tipo, lat, lng
        FROM registros 
        WHERE usuario_id = ?
        ORDER BY data_hora DESC LIMIT 100
    ''', (usuario_id,))
    rows = cursor.fetchall()
    conn.close()
    
    resultado = [{"hora": row[0], "tipo": row[1], "lat": row[2], "lng": row[3]} for row in rows]
    return resultado


@app.post("/api/registrar-usuario")
async def registrar_usuario(nome: str = Form(...), cpf: str = Form(None), email: str = Form(None), foto: UploadFile = File(None)):
    face_data_json = None
    face_roi = None
    
    if foto is not None and foto.filename:
        image_bytes = await foto.read()
        if len(image_bytes) > 0:
            face_roi = extrair_face(image_bytes)
            if face_roi is None:
                raise HTTPException(status_code=400, detail="Nenhum rosto detectado na imagem.")
            face_data_json = json.dumps(face_roi.tolist())
    
    codigo_cru = secrets.token_hex(3).upper()
    codigo_hash = get_password_hash(codigo_cru)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO usuarios (nome, codigo_hash, cpf, email, face_data) VALUES (?, ?, ?, ?, ?)",
                       (nome, codigo_hash, cpf, email, face_data_json))
        conn.commit()
        usuario_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=500, detail="Erro interno no registro.")
    conn.close()
    
    if face_roi is not None:
        global modelo_treinado
        if modelo_treinado:
            recognizer.update([face_roi], np.array([usuario_id]))
        else:
            recognizer.train([face_roi], np.array([usuario_id]))
            modelo_treinado = True
        
    return {"status": "sucesso", "codigo_unico": codigo_cru, "nome": nome, "mensagem": "Usuário registrado."}


@app.post("/api/bater-ponto/codigo")
async def bater_ponto_codigo(payload: dict):
    codigo_str = payload.get("codigo")
    lat = payload.get("lat")
    lng = payload.get("lng")

    if not codigo_str: raise HTTPException(status_code=400, detail="Código não fornecido.")
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Pega todos os codigos hashados da base já que não podemos reverter a criptografia para fazer um SELECT WHERE
    # Em produção grande DB, usaríamos CPF ou Email como chave primária de recuperação e a Senha seria o Código.
    cursor.execute("SELECT id, codigo_hash FROM usuarios WHERE face_data IS NULL OR face_data IS NOT NULL")
    usuarios = cursor.fetchall()
    conn.close()
    
    usuario_encontrado_id = None
    for uid, hashed_cd in usuarios:
        if hashed_cd and verify_password(codigo_str.upper(), hashed_cd):
            usuario_encontrado_id = uid
            break

    if not usuario_encontrado_id:
        raise HTTPException(status_code=400, detail="Credencial Inválida ou Não Encontrada.")
        
    return processar_ponto(usuario_encontrado_id, lat, lng)


@app.post("/api/bater-ponto/face")
async def bater_ponto_face(foto: UploadFile = File(...), lat: float = Form(None), lng: float = Form(None)):
    if not modelo_treinado:
        raise HTTPException(status_code=400, detail="O sistema facial ainda não possui usuários cadastrados.")
        
    image_bytes = await foto.read()
    face_roi = extrair_face(image_bytes)
    
    if face_roi is None:
        raise HTTPException(status_code=400, detail="Nenhum rosto detectado.")
        
    label_id, confianca = recognizer.predict(face_roi)
    
    if confianca > 85:
         raise HTTPException(status_code=401, detail=f"Inseguro ({confianca:.1f}).")
         
    return processar_ponto(label_id, lat, lng)


@app.get("/api/historico")
async def get_historico(admin: dict = Depends(verificar_admin)):
    """Retorna o histórico PROTEGIDO POR JWT - Somente admin."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.nome, r.data_hora, r.tipo, r.lat, r.lng
        FROM registros r
        JOIN usuarios u ON r.usuario_id = u.id
        ORDER BY r.data_hora DESC LIMIT 100
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    resultado = [{"nome": row[0], "hora": row[1], "tipo": row[2], "lat": row[3], "lng": row[4]} for row in rows]
    return resultado