# Karaoke Remote

[English](README.md) | Tiếng Việt

Ứng dụng karaoke chạy cục bộ cho tiệc tại nhà: máy tính làm màn hình phát toàn màn hình, còn điện thoại của khách dùng để quét mã, tìm bài, thêm vào hàng chờ và điều khiển phát nhạc theo thời gian thực.

## Showcase

### Host

<table>
  <tr>
    <th>Màn hình phát toàn màn hình</th>
  </tr>
  <tr>
    <td><img src="docs/showcase/host-player.png" alt="Màn hình host của Karaoke Remote" height="360"></td>
  </tr>
</table>

### Guest

<table>
  <tr>
    <th>Điều khiển danh sách</th>
    <th>Màn hình tìm kiếm</th>
    <th>Giao diện tablet</th>
  </tr>
  <tr>
    <td><img src="docs/showcase/guest-remote.png" alt="Màn hình điều khiển danh sách trên điện thoại" height="360"></td>
    <td><img src="docs/showcase/guest-search.png" alt="Màn hình tìm kiếm trên điện thoại" height="360"></td>
    <td><img src="docs/showcase/guest-tablet.png" alt="Giao diện tablet của Karaoke Remote" height="360"></td>
  </tr>
</table>

## Mục đích

Karaoke Remote biến laptop hoặc TV thành màn hình phát chung, trong khi mọi người dùng điện thoại làm remote. Host tạo phiên cục bộ, khách tham gia bằng mã QR, và danh sách bài hát được đồng bộ qua WebSocket.

## Điểm nổi bật

- Màn hình host kiểu toàn màn hình với trình phát YouTube và các lớp điều khiển nổi.
- Khách tham gia nhanh bằng QR trên điện thoại hoặc tablet cùng mạng.
- Remote ưu tiên mobile cho tìm kiếm, thêm bài, phát/tạm dừng, chuyển bài, chọn bài và xóa bài.
- Đồng bộ phiên theo thời gian thực bằng WebSocket.
- Backend proxy tìm kiếm YouTube qua YouTube Data API chính thức.
- Giao diện tiếng Việt mặc định.

## Công nghệ

| Phần | Công nghệ |
| --- | --- |
| Frontend | React, Vite, TypeScript |
| Backend | Express, TypeScript |
| Realtime | WebSocket server với `ws` |
| Nguồn karaoke | YouTube IFrame Player API, YouTube Data API |
| Mã QR | `qrcode` |

## Yêu cầu

- Node.js 20+
- npm
- YouTube Data API key

## Chạy nhanh

```sh
npm install
cp .env.example .env
```

Sửa `.env`:

```env
PORT=3001
APP_PUBLIC_ORIGIN=http://localhost:5173
YOUTUBE_API_KEY=your_youtube_api_key
```

Khởi động ứng dụng:

```sh
make dev
```

Mở màn hình host tại `http://localhost:5173`.

## Truy cập bằng điện thoại

Điện thoại không thể dùng `localhost` để truy cập máy host. Khi khách dùng cùng Wi-Fi, đặt `APP_PUBLIC_ORIGIN` thành địa chỉ LAN IP của máy host:

```env
APP_PUBLIC_ORIGIN=http://192.168.x.x:5173
```

Vite dev server bind vào `0.0.0.0`, nên thiết bị trong mạng LAN có thể truy cập khi firewall của hệ điều hành cho phép kết nối vào.

## Cách sử dụng

1. Mở `http://localhost:5173` trên máy host.
2. Host tạo phiên karaoke và hiển thị nút QR ở góc trên bên phải.
3. Khách quét mã QR hoặc mở join URL trên điện thoại.
4. Khách tìm theo tên bài hát hoặc ca sĩ; ứng dụng tự thêm từ khóa `karaoke` khi cần.
5. Khách thêm bài vào hàng chờ.
6. Host overlay và guest playlist drawer đều có thể phát, tạm dừng, chuyển bài, chọn bài hoặc xóa bài.

## Lệnh thường dùng

| Lệnh | Mô tả |
| --- | --- |
| `make install` | Cài dependencies bằng npm. |
| `make dev` | Chạy frontend và backend cùng lúc. |
| `make dev-fe` | Chỉ chạy Vite frontend. |
| `make dev-be` | Chỉ chạy Express/WebSocket backend. |
| `make down` | Dừng các port dev của frontend và backend. |
| `make build` | Typecheck và build client/server. |
| `make start` | Chạy server production sau khi build. |
| `make clean` | Xóa output build. |

Port mặc định khi chạy local:

- Frontend: `http://localhost:5173`
- Backend/API/WebSocket: `http://localhost:3001`

## Build production

```sh
make build
make start
```

Bản production phục vụ Vite client từ `dist/client`, đồng thời chạy API/WebSocket server từ cùng Express app.

## Cấu trúc dự án

```txt
client/src/
  api/             REST API clients
  components/      React UI dùng chung
  hooks/           WebSocket session hook
  pages/           trang host và guest
  types/           kiểu dữ liệu session/message phía client
  styles.css       style của ứng dụng

server/src/
  config/          tải cấu hình môi trường
  routes/          REST API routes
  services/        session store và YouTube API access
  types/           kiểu dữ liệu phía server
  ws/              xử lý WebSocket message
```

## Kiểm tra

Trước khi commit thay đổi, chạy:

```sh
npm run build
```

Với thay đổi UI, cũng nên chạy app và kiểm tra bằng browser:

- Trang host tạo phiên và hiển thị trạng thái đã kết nối.
- QR panel mở được và join URL khớp với `APP_PUBLIC_ORIGIN`.
- Trang guest hoạt động trong mobile viewport.
- Tìm kiếm trả về kết quả và tự thêm `karaoke`.
- Thêm bài cập nhật cả hàng chờ của guest và overlay của host.
- Phát/tạm dừng/chuyển bài/chọn bài/xóa bài đồng bộ giữa host và guest.

## Ghi chú môi trường

- `.env` chỉ dùng local và đã được git ignore.
- `.env.example` mô tả biến môi trường cần thiết mà không chứa secret.
- `YOUTUBE_API_KEY` chỉ nằm phía server.
