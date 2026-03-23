# Checkpoint — Proje Özeti (Claude Code İçin)

## Proje Nedir?
Letterboxd / Backloggd benzeri oyun takip uygulaması. Kullanıcılar oyun arayabilir, kütüphanelerine ekleyebilir, durumlarını takip edebilir (Playing, Completed, Want to Play, Dropped), puanlayabilir, yorum yazabilir ve istatistiklerini görebilir.

## Canlı Linkler
- **Frontend:** https://checkpoint-delta.vercel.app
- **Backend API:** https://checkpoint-api-a06342829980.herokuapp.com
- **API Docs:** https://checkpoint-api-a06342829980.herokuapp.com/docs

## Tech Stack
- **Backend:** Python 3.12, FastAPI, PostgreSQL, SQLAlchemy 2.0, Alembic, JWT (bcrypt), IGDB API (httpx async)
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Axios, Recharts
- **Deploy:** Heroku (backend + PostgreSQL), Vercel (frontend)
- **Test:** pytest + FastAPI TestClient

## Tamamlanan Özellikler

### Backend
- JWT authentication (register, login, /me)
- Şifre hashleme (bcrypt)
- IGDB API entegrasyonu (async, token caching, 10s timeout, input sanitization, retry on 401)
- Kütüphane CRUD (add, list, update, delete)
- İstatistik endpoint (/library/stats)
- Merkezi config (pydantic-settings, tek .env okuma noktası)
- Pydantic validation (GameStatus enum, Field min/max, EmailStr)
- N+1 problemi çözümü (game_name ve game_cover_url UserGame tablosunda)
- CORS middleware (localhost:5173 + Vercel URL)
- Alembic migration yönetimi
- 15 pytest testi (auth + library + validation)

### Frontend
- Register / Login sayfaları
- Oyun arama (IGDB'den, responsive grid)
- Oyun detay sayfası + kütüphaneye ekleme formu
- Kütüphane sayfası (filtreleme, status değiştirme, silme)
- İstatistik sayfası (Recharts — PieChart, BarChart, istatistik kartları)
- Navbar (auth durumuna göre değişir)
- AuthContext (global auth state, token yönetimi)
- ProtectedRoute (giriş yapmadan erişim engelleme)
- Merkezi tipler (types.ts)
- Utility fonksiyonlar (utils.ts — getCoverUrl, getYear)
- Axios interceptor (otomatik JWT token ekleme)
- Environment variable ile API URL (VITE_API_URL)
- SPA routing düzeltmesi (vercel.json rewrites)

## Dosya Yapısı

```
checkpoint/
├── .gitignore
├── README.md
├── Procfile                    → Heroku: cd backend && uvicorn main:app
├── requirements.txt            → Root: -r backend/requirements.txt
├── runtime.txt                 → python-3.12.8
├── backend/
│   ├── main.py                 → FastAPI app, CORS, router bağlama
│   ├── config.py               → Pydantic Settings, merkezi .env okuma
│   ├── database.py             → SQLAlchemy engine, session, get_db dependency
│   ├── models.py               → User, UserGame tabloları
│   ├── schemas.py              → Pydantic schemas (GameStatus enum, validation)
│   ├── auth.py                 → hash_password, verify_password, create_access_token, get_current_user
│   ├── router_auth.py          → POST /auth/register, POST /auth/login, GET /auth/me
│   ├── router_games.py         → GET /games/search, GET /games/{game_id}
│   ├── router_library.py       → POST/GET/PUT/DELETE /library, GET /library/stats
│   ├── igdb_service.py         → IGDB API (get_twitch_token, igdb_request, search_games, get_game_detail)
│   ├── test_api.py             → 15 pytest testleri
│   ├── requirements.txt        → Python paketleri
│   ├── .env.example            → Environment variable şablonu
│   ├── alembic.ini             → Alembic konfigürasyonu
│   └── alembic/
│       ├── env.py              → config.py'den db_url okuyor
│       └── versions/           → Migration dosyaları
└── frontend/
    ├── vercel.json             → SPA routing rewrites
    ├── vite.config.ts          → Vite + TailwindCSS plugin
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── main.tsx            → React DOM render
        ├── App.tsx             → BrowserRouter, AuthProvider, Navbar, Routes
        ├── api.ts              → Axios instance (VITE_API_URL, interceptor)
        ├── AuthContext.tsx      → createContext, useAuth hook
        ├── ProtectedRoute.tsx  → Route guard
        ├── Navbar.tsx          → Navigasyon
        ├── types.ts            → User, Game, LibraryEntry, GAME_STATUSES
        ├── utils.ts            → getCoverUrl, getYear
        ├── index.css           → @import "tailwindcss"
        └── pages/
            ├── Login.tsx
            ├── Register.tsx
            ├── Search.tsx
            ├── GameDetail.tsx
            ├── Library.tsx
            └── Stats.tsx
```

## Veritabanı Modelleri

### users
- id: INTEGER, PRIMARY KEY, AUTO INCREMENT
- username: VARCHAR(50), UNIQUE, NOT NULL
- email: VARCHAR(100), UNIQUE, NOT NULL
- hashed_password: VARCHAR(255), NOT NULL
- created_at: TIMESTAMP WITH TIMEZONE, DEFAULT NOW()

### user_games
- id: INTEGER, PRIMARY KEY, AUTO INCREMENT
- user_id: INTEGER, FOREIGN KEY → users.id, NOT NULL
- game_id: INTEGER, NOT NULL
- game_name: VARCHAR(255), NOT NULL
- game_cover_url: VARCHAR(500), NULLABLE
- status: VARCHAR(20), NOT NULL
- rating: FLOAT, NULLABLE
- review: TEXT, NULLABLE
- created_at: TIMESTAMP WITH TIMEZONE, DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIMEZONE, DEFAULT NOW(), ON UPDATE NOW()
- UNIQUE CONSTRAINT (user_id, game_id)

## API Endpoint'leri

### Auth
- POST /auth/register → Kayıt (username, email, password)
- POST /auth/login → Giriş (email, password) → JWT token
- GET /auth/me → Token ile kullanıcı bilgisi [AUTH]

### Games
- GET /games/search?query=zelda → IGDB'den oyun ara
- GET /games/{game_id} → Oyun detayı

### Library
- POST /library → Kütüphaneye ekle (IGDB'den game_name/cover çekip kaydeder) [AUTH]
- GET /library → Kütüphaneyi listele [AUTH]
- PUT /library/{game_id} → Status/rating/review güncelle [AUTH]
- DELETE /library/{game_id} → Kütüphaneden sil [AUTH]
- GET /library/stats → İstatistikler (total, by_status, avg_rating) [AUTH]

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/checkpoint
SECRET_KEY=secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
TWITCH_CLIENT_ID=twitch-client-id
TWITCH_CLIENT_SECRET=twitch-client-secret
```

### Frontend (Vercel)
```
VITE_API_URL=https://checkpoint-api-a06342829980.herokuapp.com
```

## Önemli Teknik Detaylar
- config.py'de `db_url` property Heroku'nun `postgres://` → `postgresql://` dönüşümü yapıyor
- igdb_service.py'de global access_token cache, 401'de otomatik yenileme, 10s timeout
- router_library.py'de add_game async — IGDB'den game bilgisi çekiyor
- alembic/env.py config.py'den db_url okuyor (alembic.ini'deki URL kullanılmıyor)
- test_api.py ayrı checkpoint_test veritabanı kullanıyor
- GameStatus enum: Playing, Completed, Want to Play, Dropped

## Sıradaki Adımlar
1. GitHub repo iyileştirmeleri (screenshot, topics, description)
2. Arama iyileştirme (IGDB sıralama/filtreleme)
3. IGDB puanlarını düzgün gösterme (aggregated_rating ekleme)
4. Favori 4 oyun (profil sayfası)
5. Özel listeler (yeni tablo + CRUD + sayfa)

## Çalışma Tercihleri
- Organik yaklaşım: dosya/klasör ihtiyaç duydukça oluşturulur
- Her kararın nedenini açıkla
- Endüstri standardı mı, öğrenme amaçlı mı belirt
- Adım adım ilerle, hızlı gitme
- Türkçe konuşuluyor
