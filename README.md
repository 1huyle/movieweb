
# Movie Web Application

** PHÁT TRIỂN WEB CHO DỊCH VỤ XEM PHIM THEO YÊU CẦU SỬ DỤNG REACT VÀ NODE.JS**

---

## Thông tin sinh viên

- Họ và tên sinh viên 1: Lê Nhật Huy
- MSSV: 52100804
- SĐT: 0352292212
- Họ và tên sinh viên 2: Lưu Khang Huy
- MSSV: 52100805
- SĐT: 0986648481

---

## Cấu trúc thư mục

```
Source/
├── movie-fe/               # Frontend - React + Tailwind + Vite
│   ├── public/
│   ├── src/
│   │   ├── assets/         # Tài nguyên tĩnh (hình ảnh, icon...)
│   │   ├── components/     # Các component React tái sử dụng
│   │   ├── config/         # Cấu hình API, biến môi trường
│   │   ├── context/        # React context API
│   │   ├── hooks/          # Custom hooks
│   │   ├── Pages/          # Các trang chính của ứng dụng
│   │   ├── utils/          # Các hàm tiện ích
│   │   ├── App.jsx         # Component gốc
│   │   ├── main.jsx        # Điểm bắt đầu React app
│   │   └── index.css       # File CSS chính
│   ├── Dockerfile
│   ├── .env
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── Nodejs/                 # Backend - Node.js + Express + Sequelize
│   ├── src/                # Mã nguồn chính: models, routes, controllers
│   ├── uploads/            # Thư mục lưu hình ảnh upload
│   ├── docker/             # File cấu hình Docker thêm
│   ├── Dockerfile
│   ├── .env
│   ├── docker-compose.yml  # Chạy frontend + backend đồng thời
│   ├── .sequelizerc        # Cấu hình Sequelize CLI
│   └── package.json
```

---

## Tính năng

- Xem danh sách phim, chi tiết phim, season, tập phim
- Đăng nhập, đăng ký, phân quyền người dùng
- Lưu lịch sử xem phim
- Tìm kiếm phim theo tên
- Giao diện đẹp, responsive
- Hỗ trợ upload hình ảnh poster, banner
- RESTful API
- Docker + docker-compose để triển khai toàn bộ hệ thống

---

## Công nghệ sử dụng

### Frontend

- `React.js` + `Vite`
- `TailwindCSS`
- `React Router`
- `Axios` để gọi API
- `Context API` + `Custom Hooks`

### Backend

- `Node.js`, `Express.js`
- `Sequelize ORM` + `MySQL` (hoặc `PostgreSQL`)
- `JWT Authentication`
- `Multer` để upload hình ảnh
- `dotenv`, `bcrypt`, `cors`

### DevOps

- `Docker`, `Docker Compose`
- `ESLint` cho kiểm tra mã nguồn
- `.env` để cấu hình biến môi trường

---

## Triển khai hệ thống bằng Docker

Hệ thống được triển khai dựa trên nền tảng **Docker** nhằm đảm bảo tính nhất quán, dễ dàng cấu hình và thuận tiện trong quá trình phát triển – triển khai. Toàn bộ frontend và backend được container hóa độc lập và được điều phối thông qua **Docker Compose**.

### Yêu cầu cấu hình ban đầu

- Cài đặt **Docker** và **Docker Compose**
- Tạo 2 file `.env` cho:
  - `movie-fe/` (frontend)
  - `Nodejs/` (backend)

### Các bước triển khai

**1. Clone dự án**

```bash
git clone https://github.com/huy293/DA_CNTT.git
cd DA_CNTT
```

**2. Build các container**

```bash
docker compose build
```

**3. Khởi động toàn bộ hệ thống**

```bash
docker compose up
```

**4. Cấu hình cơ sở dữ liệu (MySQL)**

- Tạo database tên: `HH_Movie`
- Port: `3307`
- Username: `huydev`
- Password: `22032003`

**5. Thiết lập Driver Properties**

```text
allowPublicKeyRetrieval=true
useSSL=false
```

**6. Thực hiện migrate và seed dữ liệu**

Mở Docker Desktop → Containers → `da_cntt` → Exec (vào container backend):

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

### Truy cập hệ thống

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8888/api

> Việc sử dụng Docker giúp đơn giản hoá quy trình triển khai, đảm bảo hệ thống chạy nhất quán trên mọi môi trường, giảm thiểu lỗi cấu hình, và dễ dàng mở rộng trong tương lai.

---
