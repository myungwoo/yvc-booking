# yvc-booking

좌석 예약 시스템

## 버전 정보

* Ubuntu 20.04
* node.js v16.7.0

## Ubuntu 환경에서 필요한 패키지 설치

```
sudo apt install nginx build-essential python -y
```

## 개발 환경 세팅

### 패키지 설치

```
npm i && cd client && npm i
```

### sequelize migrate

```
npx sequelize-cli db:migrate
```

### 개발 환경 실행

```
npm start
```

### Push 전에 lint 확인

```
npm run lint
cd client && npm run lint
```

## 배포 방법

### 클라이언트 빌드

```
cd client && npm run build
```

### pm2 사용 예시

```
npm i -g pm2
```

```
pm2 start ecosystem.config.js --env production
```

## 부록

### nginx site 설정 파일 예시

```
server {
	server_name __server_name__;

	location / {
		proxy_pass http://localhost:3000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "Upgrade";
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}
}
```
