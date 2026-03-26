# ✈️ ICN Flight Alert — Frontend

**ICN Flight Alert** 백엔드 API와 연동하는 **React + Vite** 기반 웹 클라이언트입니다. 인천공항 비행편 등록·모니터링, 알림·변경 이력 조회, 공항 안내 챗봇까지 브라우저에서 이용할 수 있습니다.

---

## 🛠 Tech Stack

* **Build Tool**: `Vite`
* **UI Library**: `React`
* **Routing**: `react-router-dom`
* **HTTP Client**: `axios` (JWT 인터셉터, `Authorization: Bearer`)
* **Styling**: `Tailwind CSS`
* **Language**: JavaScript (JSX)

---

## ✨ Key Features

### 🔐 인증

* **회원가입 / 로그인**: 백엔드 `POST /auth/signup`, `POST /auth/login` 연동
* **JWT**: `localStorage`에 `access_token` 저장, 요청 시 자동 첨부
* **세션 복구**: 앱 로드 시 `GET /me`로 사용자 정보 조회
* **보호 라우트**: 대시보드·챗봇은 로그인 후에만 접근

### 📅 비행편 (대시보드)

* **목록**: `GET /flights` — 본인 비행편만 표시
* **등록**: `POST /flights` — 편명, 날짜, 출발/도착 구분
* **갱신 / 모니터링 on·off / 삭제**: 백엔드 Flight API와 동일 동작
* **변경 이력**: `GET /flights/{flight_pk}/logs` — 카드에서 펼쳐 조회
* **내 알림**: `GET /notifications?user_email=...` — 유형 필터·새로고침

### 🤖 공항 챗봇

* **소개**: `GET /chatbot`
* **대화**: `POST /chatbot/chat` — 터미널(T1/T2), 선택적 대기 시간(시간)

### 🧭 공통 UI

* **App 레이아웃**: 상단 네비(대시보드 / 공항 챗봇), 이메일·로그아웃

---

## 🏗 프로젝트 구조

```
src/
├── api/
│   ├── axios.js          # baseURL, JWT 인터셉터
│   ├── flights.js
│   ├── chatbot.js
│   ├── notifications.js
│   └── flightLogs.js
├── components/
│   └── AppLayout.jsx     # 공통 네비게이션
├── context/
│   └── AuthContext.jsx   # 로그인 상태, signup/login/logout
├── pages/
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── DashboardPage.jsx
│   └── ChatbotPage.jsx
├── utils/
│   └── apiError.js       # FastAPI 에러 메시지 파싱
├── App.jsx
└── main.jsx
```

---

## 📸 UI 스크린샷


| 순서 | 화면 설명 | 아래 섹션 |
|:---:|:---|:---|
| 1 | 로그인 | [1. 로그인](#1-로그인) |
| 2 | 회원가입 | [2. 회원가입](#2-회원가입) |
| 3 | 대시보드 (비행편 없음) | [3. 대시보드 — 빈 상태](#3-대시보드--빈-상태) |
| 4 | 비행편 등록 모달 | [4. 비행편 등록 모달](#4-비행편-등록-모달) |
| 5 | 대시보드 (비행편 목록 + 버튼) | [5. 대시보드 — 목록](#5-대시보드--목록) |
| 6 | 변경 이력 펼침 또는 내 알림 | [6. 대시보드 — 이력·알림](#6-대시보드--변경-이력--내-알림) |
| 7 | 공항 챗봇 | [7. 공항 챗봇](#7-공항-챗봇) |

---

### 1. 로그인

<!-- 📷 이미지 첨부: `docs/screenshots/01-login.png` 로 교체하거나 URL로 붙여넣기 -->

![로그인 화면](docs/screenshots/01-login.png)

### 2. 회원가입

<!-- 📷 이미지 첨부: `docs/screenshots/02-signup.png` -->

![회원가입 화면](docs/screenshots/02-signup.png)

### 3. 대시보드 — 빈 상태

<!-- 📷 이미지 첨부: `docs/screenshots/03-dashboard-empty.png` — 등록된 비행편이 없을 때 -->

![대시보드 빈 상태](docs/screenshots/03-dashboard-empty.png)

### 4. 비행편 등록 모달

<!-- 📷 이미지 첨부: `docs/screenshots/04-register-modal.png` -->

![비행편 등록 모달](docs/screenshots/04-register-modal.png)

### 5. 대시보드 — 목록

<!-- 📷 이미지 첨부: `docs/screenshots/05-dashboard-flights.png` -->

![대시보드 비행편 목록](docs/screenshots/05-dashboard-flights.png)

### 6. 대시보드 — 변경 이력 · 내 알림

<!-- 📷 이미지 첨부: `docs/screenshots/06-dashboard-logs-notifications.png` — 변경 이력 펼침 또는 알림 목록 -->

![변경 이력 또는 내 알림](docs/screenshots/06-dashboard-logs-notifications.png)

### 7. 공항 챗봇

<!-- 📷 이미지 첨부: `docs/screenshots/07-chatbot.png` -->

![공항 챗봇](docs/screenshots/07-chatbot.png)


---

## ⚙️ 사용법

### 사전 요구 사항

* **Node.js** (LTS 권장, 예: 20.x)
* **백엔드** [icn-flight-alert](https://github.com/zynxquzo/icn-flight-alert) `http://localhost:8000` 에서 실행 중

백엔드 `main.py`의 CORS에 `http://localhost:5173`이 허용되어 있어야 브라우저에서 API 호출이 됩니다.

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-org/icn-flight-alert-frontend.git
cd icn-flight-alert-frontend

# 의존성 설치
npm install

# 개발 서버 (기본 http://localhost:5173)
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 → **회원가입** 후 **로그인** → **대시보드**에서 비행편 등록·**공항 챗봇** 이동을 테스트합니다.

### API 연동 주소

`src/api/axios.js`의 `baseURL`이 백엔드와 같아야 합니다.

```js
// 기본값
baseURL: 'http://localhost:8000'
```

배포 시에는 실제 API 도메인으로 변경합니다.

### 빌드·미리보기

```bash
npm run build
npm run preview
```

`dist/`에 정적 파일이 생성됩니다. 정적 호스팅(Vercel, Netlify, S3 등)에 `dist`를 올리면 됩니다.

### 스크립트

| 명령 | 설명 |
|:---|:---|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run lint` | ESLint |

---

## 🚨 Troubleshooting

### CORS 오류 (Network Error)

* 백엔드가 실행 중인지, `localhost:8000`이 맞는지 확인합니다.
* 프론트를 `5173`이 아닌 다른 포트로 띄운 경우 백엔드 `main.py`의 `origins`에 해당 URL을 추가합니다.

### 401 후 로그인 페이지로 이동

* `axios` 응답 인터셉터가 401일 때 토큰을 지우고 `/login`으로 보냅니다. JWT 만료 또는 잘못된 토큰이면 다시 로그인합니다.

### 챗봇만 응답이 없음

* 백엔드 `OPENAI_API_KEY` 등 환경 변수가 설정되어 있는지 확인합니다. (챗봇 서비스 구현에 따라 다름)

---

## 🔗 관련 저장소

* **Backend**: [icn-flight-alert](https://github.com/zynxquzo/icn-flight-alert) — FastAPI, PostgreSQL, JWT, 비행편·알림·챗봇 API

---

## 👨‍💻 Author

* GitHub: [@zynxquzo](https://github.com/zynxquzo)