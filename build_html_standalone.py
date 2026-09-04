import json
import os

with open("public/openapi.json", "r", encoding="utf-8") as f:
    spec_data = json.load(f)

spec_json_str = json.dumps(spec_data, ensure_ascii=False)

html_template = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutoDealership Enterprise API - QA Training & Swagger Hub</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'><path d='M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z'/><circle cx='7.5' cy='14.5' r='1.5'/><circle cx='16.5' cy='14.5' r='1.5'/></svg>">
  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --accent: #f59e0b;
      --success: #10b981;
      --danger: #ef4444;
      --bg-dark: #0f172a;
      --surface-dark: #1e293b;
      --border-dark: #334155;
      --text-dark: #f8fafc;
      --text-muted: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
    }

    body.dark-mode {
      background-color: #0b0f19;
      color: #f1f5f9;
    }

    /* DEALERSHIP HEADER */
    .top-header {
      background: linear-gradient(135deg, #0b0f19 0%, #1e293b 100%);
      color: white;
      padding: 16px 24px;
      border-bottom: 2px solid #2563eb;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }

    .header-container {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
    }

    .brand-logo svg {
      width: 26px;
      height: 26px;
      fill: white;
    }

    .brand-text h1 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .version-badge {
      font-size: 11px;
      background: rgba(37, 99, 235, 0.3);
      border: 1px solid #3b82f6;
      color: #93c5fd;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
    }

    .brand-text p {
      font-size: 12px;
      color: #94a3b8;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }
    .btn-primary:hover { background: #1d4ed8; }

    .btn-amber {
      background: #f59e0b;
      color: #0f172a;
    }
    .btn-amber:hover { background: #d97706; }

    .btn-outline {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      color: #e2e8f0;
    }
    .btn-outline:hover {
      background: rgba(255,255,255,0.15);
      color: white;
    }

    /* QA TRAINING BANNER & TABS */
    .qa-hub-container {
      max-width: 1440px;
      margin: 20px auto 0;
      padding: 0 20px;
    }

    .qa-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      margin-bottom: 24px;
      transition: all 0.3s;
    }

    body.dark-mode .qa-card {
      background: #131d31;
      border-color: #24344d;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }

    .qa-header {
      padding: 16px 24px;
      background: linear-gradient(90deg, #1e293b, #0f172a);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .qa-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 15px;
    }

    .qa-nav {
      display: flex;
      gap: 4px;
      padding: 8px 16px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      overflow-x: auto;
    }

    body.dark-mode .qa-nav {
      background: #0f172a;
      border-bottom-color: #24344d;
    }

    .qa-tab-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      background: none;
      border: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .qa-tab-btn.active {
      background: #2563eb;
      color: white;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    }

    .qa-tab-content {
      display: none;
      padding: 24px;
    }

    .qa-tab-content.active {
      display: block;
    }

    /* TABLES & MATRIX */
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 10px;
    }

    .custom-table th, .custom-table td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    body.dark-mode .custom-table th, body.dark-mode .custom-table td {
      border-bottom-color: #24344d;
    }

    .custom-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
    }

    body.dark-mode .custom-table th {
      background: #182234;
      color: #94a3b8;
    }

    .custom-table tr:hover {
      background-color: #f8fafc;
    }

    body.dark-mode .custom-table tr:hover {
      background-color: #172439;
    }

    .copy-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      cursor: pointer;
      color: #0f172a;
      transition: background 0.15s;
    }

    body.dark-mode .copy-chip {
      background: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
    }

    .copy-chip:hover {
      background: #e2e8f0;
    }
    body.dark-mode .copy-chip:hover {
      background: #334155;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-admin { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-manager { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-sale { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }
    .badge-customer { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

    body.dark-mode .badge-admin { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4); }
    body.dark-mode .badge-manager { background: rgba(245, 158, 11, 0.2); color: #fde68a; border-color: rgba(245, 158, 11, 0.4); }
    body.dark-mode .badge-sale { background: rgba(99, 102, 241, 0.2); color: #c7d2fe; border-color: rgba(99, 102, 241, 0.4); }
    body.dark-mode .badge-customer { background: rgba(16, 185, 129, 0.2); color: #86efac; border-color: rgba(16, 185, 129, 0.4); }

    /* WORKFLOW GRID */
    .workflow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      margin-top: 10px;
    }

    .workflow-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }

    body.dark-mode .workflow-card {
      background: #172439;
      border-color: #24344d;
    }

    .workflow-card h4 {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    body.dark-mode .workflow-card h4 {
      color: #f1f5f9;
    }

    .step-list {
      list-style: none;
      counter-reset: step-counter;
      font-size: 12.5px;
    }

    .step-list li {
      counter-increment: step-counter;
      margin-bottom: 8px;
      position: relative;
      padding-left: 26px;
      color: #475569;
    }

    body.dark-mode .step-list li {
      color: #94a3b8;
    }

    .step-list li::before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: 0;
      width: 18px;
      height: 18px;
      background: #2563eb;
      color: white;
      font-size: 10px;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* SWAGGER UI OVERRIDES */
    #swagger-ui {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 20px 60px;
    }

    .swagger-ui .topbar {
      display: none !important;
    }

    .swagger-ui .info {
      margin: 20px 0 !important;
    }

    .swagger-ui .scheme-container {
      background: white !important;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
      border-radius: 12px !important;
      border: 1px solid #e2e8f0 !important;
      padding: 16px 20px !important;
      margin-bottom: 20px !important;
    }

    body.dark-mode .swagger-ui .scheme-container {
      background: #131d31 !important;
      border-color: #24344d !important;
    }

    body.dark-mode .swagger-ui {
      filter: invert(88%) hue-rotate(180deg);
    }
    body.dark-mode .swagger-ui img,
    body.dark-mode .swagger-ui .top-header,
    body.dark-mode .swagger-ui .brand-logo {
      filter: invert(100%) hue-rotate(180deg);
    }

    /* TOAST NOTIFICATION */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      display: none;
      z-index: 9999;
      border-left: 4px solid #10b981;
    }
  </style>
</head>
<body>

  <!-- TOP DEALERSHIP HEADER -->
  <header class="top-header">
    <div class="header-container">
      <div class="brand-section">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/><circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/></svg>
        </div>
        <div class="brand-text">
          <h1>AutoDealership Enterprise <span class="version-badge">API Spec v25.0 Master</span></h1>
          <p>Interactive API Console &amp; Automated Testing Hub for QA Engineers</p>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-amber" onclick="toggleQAPanel()">
          🧪 QA Testing Training Hub
        </button>
        <button class="btn btn-outline" onclick="downloadSpec()">
          📥 Export OpenAPI JSON
        </button>
        <button class="btn btn-outline" onclick="toggleDarkMode()">
          🌓 <span id="themeText">Dark Mode</span>
        </button>
      </div>
    </div>
  </header>

  <!-- QA TRAINING & CHEAT-SHEET HUB -->
  <div class="qa-hub-container">
    <div class="qa-card" id="qaPanel">
      <div class="qa-header" onclick="toggleQAPanel()">
        <div class="qa-title">
          <span>🎯</span>
          <span>QA Engineering &amp; Tester Training Command Center</span>
        </div>
        <span id="qaToggleIcon" style="font-size: 14px;">▼ Thu gọn</span>
      </div>

      <div class="qa-nav">
        <button class="qa-tab-btn active" onclick="switchQATab(event, 'tab-accounts')">🔑 Test Personas &amp; Credentials</button>
        <button class="qa-tab-btn" onclick="switchQATab(event, 'tab-rbac')">🛡️ RBAC Permission Matrix</button>
        <button class="qa-tab-btn" onclick="switchQATab(event, 'tab-statemachines')">🔄 State Machine Diagrams</button>
        <button class="qa-tab-btn" onclick="switchQATab(event, 'tab-errors')">⚠️ Error Codes Dictionary</button>
        <button class="qa-tab-btn" onclick="switchQATab(event, 'tab-scenarios')">🧪 6 Guided QA Test Scenarios</button>
      </div>

      <!-- TAB 1: ACCOUNTS -->
      <div id="tab-accounts" class="qa-tab-content active">
        <h3 style="margin-bottom: 8px; font-size: 16px;">Bộ tài khoản mẫu Sandbox &amp; Thông tin xác thực</h3>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Nhấn vào bất kỳ mục nào để sao chép thông tin vào bộ nhớ tạm (Clipboard):</p>

        <table class="custom-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Họ tên</th>
              <th>Email / Tên đăng nhập</th>
              <th>Số điện thoại</th>
              <th>Mật khẩu</th>
              <th>Phạm vi (Showroom / Scope)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="badge badge-admin">ADMIN</span></td>
              <td>Nguyễn Văn Admin</td>
              <td><span class="copy-chip" onclick="copyText('admin@autodealer.vn')">admin@autodealer.vn 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('0900000001')">0900000001 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('Admin@123')">Admin@123 📋</span></td>
              <td>Toàn hệ thống, Cấu hình chiết khấu, Audit Logs, Decrypt PII CCCD</td>
            </tr>
            <tr>
              <td><span class="badge badge-manager">MANAGER</span></td>
              <td>Trần Thị Manager HN</td>
              <td><span class="copy-chip" onclick="copyText('manager.hn@autodealer.vn')">manager.hn@autodealer.vn 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('0900000002')">0900000002 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('Admin@123')">Admin@123 📋</span></td>
              <td>Showroom Cầu Giấy (Duyệt cọc, Hold VIN, Điều chuyển kho)</td>
            </tr>
            <tr>
              <td><span class="badge badge-manager">MANAGER</span></td>
              <td>Lê Văn Manager HCM</td>
              <td><span class="copy-chip" onclick="copyText('manager.hcm@autodealer.vn')">manager.hcm@autodealer.vn 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('0900000003')">0900000003 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('Admin@123')">Admin@123 📋</span></td>
              <td>Showroom Quận 7 TP.HCM</td>
            </tr>
            <tr>
              <td><span class="badge badge-sale">SALE</span></td>
              <td>Phạm Văn Sale HN 1</td>
              <td><span class="copy-chip" onclick="copyText('sale1@autodealer.vn')">sale1@autodealer.vn 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('0900000004')">0900000004 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('Admin@123')">Admin@123 📋</span></td>
              <td>Quản lý Leads CRM, đặt lịch lái thử, gửi PayLink cho khách</td>
            </tr>
            <tr>
              <td><span class="badge badge-customer">CUSTOMER</span></td>
              <td>Nguyễn Văn Tuấn</td>
              <td><span class="copy-chip" onclick="copyText('customer1@gmail.com')">customer1@gmail.com 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('0912345678')">0912345678 📋</span></td>
              <td><span class="copy-chip" onclick="copyText('Admin@123')">Admin@123 📋</span></td>
              <td>Khách mua xe lẻ, đặt cọc, nộp hồ sơ vay ngân hàng, đổi xe cũ</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 14px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 13px;">
          <strong>💡 Hướng Dẫn Đăng Nhập Dành Cho Tester:</strong>
          <ul style="margin-left: 20px; margin-top: 6px;">
            <li>Gọi API Đăng nhập chuẩn: <code style="background: #e0e7ff; padding: 2px 5px; border-radius: 4px; font-weight: bold; color: #1e3a8a;">POST /api/v1/auth/login</code> với body JSON:
              <pre style="background: #1e293b; color: #f8fafc; padding: 8px 12px; border-radius: 6px; margin: 6px 0; font-family: 'JetBrains Mono', monospace; font-size: 12px;">{
  "identity": "admin@autodealer.vn",
  "password": "Admin@123",
  "mode": "password"
}</pre>
            </li>
            <li>API sẽ trả về <code>data.token</code> (JWT) đồng thời set cookie <code>authjs.session-token</code>. Bạn có thể copy chuỗi token này và dán vào nút <strong>Authorize 🔒</strong> góc trên bên phải của Swagger!</li>
            <li>Mã <strong>OTP Sandbox</strong> cho mọi số điện thoại: <span class="copy-chip" onclick="copyText('888888')">888888 📋</span></li>
          </ul>
        </div>
      </div>

      <!-- TAB 2: RBAC -->
      <div id="tab-rbac" class="qa-tab-content">
        <h3 style="margin-bottom: 8px; font-size: 16px;">Ma trận phân quyền (Role-Based Access Control - RBAC)</h3>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Kiểm thử phân quyền để đảm bảo không bị lỗi Privilege Escalation:</p>

        <table class="custom-table">
          <thead>
            <tr>
              <th>Nhóm Chức Năng</th>
              <th>Endpoint Path</th>
              <th>Method</th>
              <th>ADMIN</th>
              <th>MANAGER</th>
              <th>SALE</th>
              <th>CUSTOMER</th>
              <th>Ghi chú Kiểm thử Phân quyền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Đăng nhập REST API</td>
              <td><code>/api/v1/auth/login</code></td>
              <td>POST</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅ (Public)</td>
              <td>Trả về token JWT &amp; set cookie session</td>
            </tr>
            <tr>
              <td>Auth &amp; Profile</td>
              <td><code>/api/v1/users/profile</code></td>
              <td>GET / PUT</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>Mỗi user chỉ xem và sửa profile của chính mình</td>
            </tr>
            <tr>
              <td>Catalog</td>
              <td><code>/api/v1/catalog/models</code></td>
              <td>GET</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅ (Public)</td>
              <td>Không cần đăng nhập vẫn truy cập được</td>
            </tr>
            <tr>
              <td>Orders Deposit</td>
              <td><code>/api/v1/orders/deposit</code></td>
              <td>POST</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>Tự động giữ quota xe bằng Soft Lock</td>
            </tr>
            <tr>
              <td>Orders Paylink</td>
              <td><code>/api/v1/orders/{id}/send-paylink</code></td>
              <td>POST</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>❌ (403)</td>
              <td>Customer không được tự gọi API phát sinh paylink nội bộ</td>
            </tr>
            <tr>
              <td>Bank Switch</td>
              <td><code>/api/v1/loans/{id}/switch-bank</code></td>
              <td>POST</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>Tối đa 3 lần đổi ngân hàng (lần 4 trả ERR_UI_051)</td>
            </tr>
            <tr>
              <td>Trade-In Status</td>
              <td><code>/api/v1/trade-in/{id}/status</code></td>
              <td>PATCH</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>❌ (403)</td>
              <td>Chỉ nhân viên đại lý mới có quyền cập nhật giá định giá</td>
            </tr>
            <tr>
              <td>Refund Tier 1</td>
              <td><code>/api/v1/refunds/{id}/decision</code></td>
              <td>POST</td>
              <td>❌ (Tier 2)</td>
              <td>✅ (Tier 1)</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>Manager duyệt: PENDING_MANAGER &rarr; PENDING_ADMIN</td>
            </tr>
            <tr>
              <td>Refund Tier 2</td>
              <td><code>/api/v1/refunds/{id}/decision</code></td>
              <td>POST</td>
              <td>✅ (Tier 2)</td>
              <td>❌ (400)</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>Admin duyệt: PENDING_ADMIN &rarr; COMPLETED</td>
            </tr>
            <tr>
              <td>Manual VIN Hold</td>
              <td><code>/api/v1/inventory/manual-vin-hold</code></td>
              <td>POST</td>
              <td>✅</td>
              <td>✅</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>Khóa xe 24h chờ duyệt hồ sơ</td>
            </tr>
            <tr>
              <td>Damage Report</td>
              <td><code>/api/v1/inventory/transfers/{id}/damage-report</code></td>
              <td>POST</td>
              <td>✅</td>
              <td>✅</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>Cách ly xe trạng thái TRANSIT_DAMAGED</td>
            </tr>
            <tr>
              <td>CRM Leads</td>
              <td><code>/api/v1/crm/leads</code></td>
              <td>GET</td>
              <td>✅ (Tất cả)</td>
              <td>✅ (Showroom)</td>
              <td>✅ (Của mình)</td>
              <td>❌ (403)</td>
              <td>Data isolation: Sale chỉ thấy leads được giao</td>
            </tr>
            <tr>
              <td>System Config</td>
              <td><code>/api/v1/system/configs</code></td>
              <td>GET / PUT</td>
              <td>✅</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>Chỉ Super Admin, chặn chiết khấu &gt; 10% (ERR_UI_100)</td>
            </tr>
            <tr>
              <td>Decrypt PII CCCD</td>
              <td><code>/api/v1/audit/decrypt-pii</code></td>
              <td>POST</td>
              <td>✅</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>❌ (403)</td>
              <td>Giải mã AES-256-GCM với lưu vết audit bắt buộc</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB 3: STATE MACHINES -->
      <div id="tab-statemachines" class="qa-tab-content">
        <h3 style="margin-bottom: 8px; font-size: 16px;">Biểu đồ luồng trạng thái (State Machine Workflows)</h3>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Quy tắc chuyển trạng thái chặt chẽ trong hệ thống - vi phạm sẽ nhận mã lỗi <code>ERR_UI_090</code>:</p>

        <div class="workflow-grid">
          <div class="workflow-card">
            <h4>🚗 1. Luồng Đơn Cọc Xe (Order Status)</h4>
            <ul class="step-list">
              <li><strong>PENDING_PAYMENT</strong>: Đơn vừa tạo, giữ Soft Lock Quota.</li>
              <li><strong>DEPOSIT_PAID</strong>: Webhook thanh toán thành công (50M VNĐ).</li>
              <li><strong>BANK_APPROVING</strong>: Nếu mua trả góp, chờ thẩm định tín dụng.</li>
              <li><strong>APPROVED / PARTIALLY_APPROVED</strong>: Ngân hàng phê duyệt.</li>
              <li><strong>READY_FOR_DELIVERY</strong>: Xe đã gán VIN, chuẩn bị bàn giao.</li>
              <li><strong>DELIVERED</strong>: Giao xe thành công cho khách hàng.</li>
              <li><em>Hoặc CANCELED / REFUNDED nếu quá hạn thanh toán hoặc hủy cọc.</em></li>
            </ul>
          </div>

          <div class="workflow-card">
            <h4>🔄 2. Luồng Thu Cũ Đổi Mới (Trade-In Lifecycle)</h4>
            <ul class="step-list">
              <li><strong>SUBMITTED</strong>: Khách gửi thông tin xe cũ (Hãng, ODO, Giá kỳ vọng).</li>
              <li><strong>APPRAISING</strong>: Kỹ thuật viên kiểm tra 176 hạng mục xe cũ.</li>
              <li><strong>OFFERED</strong>: Showroom đưa ra mức giá thu mua chính thức.</li>
              <li><strong>ACCEPTED</strong>: Khách đồng ý mức giá chào mua.</li>
              <li><strong>CONTRACT_SIGNED</strong>: Ký hợp đồng mua bán xe cũ.</li>
              <li><strong>CREDITED_TO_ORDER</strong>: Trừ thẳng số tiền thu cũ vào đơn xe mới!</li>
            </ul>
          </div>

          <div class="workflow-card">
            <h4>💰 3. Luồng Hoàn Cọc 2 Cấp (Refund Governance)</h4>
            <ul class="step-list">
              <li><strong>PENDING_MANAGER</strong>: Khách nộp đơn kèm chứng từ từ chối vay ngân hàng.</li>
              <li><strong>PENDING_ADMIN</strong>: Showroom Manager thẩm tra hồ sơ và phê duyệt Cấp 1.</li>
              <li><strong>COMPLETED</strong>: Super Admin đối soát kế toán và phê duyệt Cấp 2.</li>
              <li>Trạng thái đơn hàng gốc tự động cập nhật sang <strong>REFUNDED</strong>.</li>
            </ul>
          </div>

          <div class="workflow-card">
            <h4>📈 4. Luồng Phễu Khách Hàng (CRM Lead Stages)</h4>
            <ul class="step-list">
              <li><strong>NEW</strong>: Khách đăng ký thông tin quan tâm xe trên Portal.</li>
              <li><strong>CONTACTED</strong>: Tư vấn bán hàng gọi điện tư vấn nhu cầu.</li>
              <li><strong>TEST_DRIVE</strong>: Khách đã đến showroom trải nghiệm lái thử.</li>
              <li><strong>NEGOTIATING</strong>: Đàm phán phương án tài chính / chiết khấu.</li>
              <li><strong>WON</strong>: Khách ký hợp đồng đặt cọc thành công!</li>
              <li><strong>LOST</strong>: Khách từ chối (Bắt buộc nhập lý do <code>lossReason</code>).</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- TAB 4: ERROR CODES -->
      <div id="tab-errors" class="qa-tab-content">
        <h3 style="margin-bottom: 8px; font-size: 16px;">Từ điển mã lỗi nghiệp vụ (Error Codes Reference)</h3>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Tất cả mã lỗi chuẩn trả về trong body <code>error.code</code> cho QA kiểm thử xác thực:</p>

        <table class="custom-table">
          <thead>
            <tr>
              <th>Error Code</th>
              <th>HTTP Status</th>
              <th>Thông điệp / Nguyên nhân</th>
              <th>Cách thức tạo lỗi để Test (Test Trigger)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>ERR_REG_001</code></td>
              <td>409 Conflict</td>
              <td>Email hoặc số điện thoại này đã được đăng ký trước đó</td>
              <td>Gọi <code>/api/v1/auth/register</code> với email <code>customer1@gmail.com</code></td>
            </tr>
            <tr>
              <td><code>ERR_REG_002</code></td>
              <td>400 Bad Request</td>
              <td>Mã OTP không đúng hoặc đã hết hạn</td>
              <td>Gọi đăng ký tài khoản với otpCode khác <code>888888</code> (ví dụ: 123456)</td>
            </tr>
            <tr>
              <td><code>ERR_REG_003</code></td>
              <td>422 Unprocessable</td>
              <td>Vi phạm chuẩn dữ liệu (Tên &lt; 2 ký tự, Email sai regex, SĐT sai định dạng VN)</td>
              <td>Gửi fullName = "A" hoặc phone = "012345"</td>
            </tr>
            <tr>
              <td><code>ERR_UI_002</code></td>
              <td>400 Bad Request</td>
              <td>Mật khẩu không đủ mạnh (Min 10 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt)</td>
              <td>Nhập mật khẩu đơn giản: <code>123456</code> hoặc <code>password</code></td>
            </tr>
            <tr>
              <td><code>ERR_UI_003</code></td>
              <td>401 Unauthorized</td>
              <td>Mật khẩu hiện tại không chính xác</td>
              <td>Gọi đổi mật khẩu với currentPassword = "SaiMatKhau"</td>
            </tr>
            <tr>
              <td><code>ERR_UI_004</code></td>
              <td>401 Unauthorized</td>
              <td>Tài khoản bị khóa tạm thời 30 phút do đăng nhập sai quá 5 lần liên tiếp</td>
              <td>Đăng nhập sai mật khẩu liên tiếp 5 lần</td>
            </tr>
            <tr>
              <td><code>ERR_UI_005</code></td>
              <td>400 Bad Request</td>
              <td>Mã OTP không hợp lệ hoặc đã hết hạn</td>
              <td>Đăng nhập mode OTP hoặc Reset Password với mã sai</td>
            </tr>
            <tr>
              <td><code>ERR_UI_030</code></td>
              <td>409 Conflict</td>
              <td>Slot lái thử đã có người đặt trước hoặc xung đột lịch hẹn</td>
              <td>Đặt cùng 1 slotId 2 lần liên tiếp</td>
            </tr>
            <tr>
              <td><code>ERR_UI_031</code></td>
              <td>400 Bad Request</td>
              <td>Định dạng số điện thoại Việt Nam không hợp lệ</td>
              <td>Gửi SĐT không thuộc đầu 03, 05, 07, 08, 09 hoặc không đủ 10 số</td>
            </tr>
            <tr>
              <td><code>ERR_UI_040</code></td>
              <td>409 Conflict</td>
              <td>Xe đã hết hàng trong kho showroom (Quota soft lock = 0)</td>
              <td>Đặt cọc biến thể xe đã hết số lượng tồn kho</td>
            </tr>
            <tr>
              <td><code>ERR_UI_048</code></td>
              <td>400 Bad Request</td>
              <td>Thông tin CCCD không hợp lệ (Không đúng 12 số, ngày cấp trong tương lai)</td>
              <td>Cập nhật CCCD = "123" hoặc ngày cấp năm 2030</td>
            </tr>
            <tr>
              <td><code>ERR_UI_049</code></td>
              <td>409 Conflict</td>
              <td>Số CCCD đã được đăng ký bởi một tài khoản khác trong hệ thống</td>
              <td>Cập nhật số CCCD trùng với CCCD của customer1: <code>001200001234</code></td>
            </tr>
            <tr>
              <td><code>ERR_UI_051</code></td>
              <td>400 Bad Request</td>
              <td>Vượt quá số lần đổi ngân hàng cho phép (Tối đa 3 lần)</td>
              <td>Gọi <code>switch-bank</code> liên tiếp 4 lần trên cùng 1 hồ sơ vay</td>
            </tr>
            <tr>
              <td><code>ERR_UI_060</code></td>
              <td>400 Bad Request</td>
              <td>Thiếu các trường thông tin bắt buộc trong payload</td>
              <td>Gửi body rỗng <code>{}</code> lên API Trade-In hoặc Hoàn cọc</td>
            </tr>
            <tr>
              <td><code>ERR_UI_070</code></td>
              <td>400 Bad Request</td>
              <td>Thiếu chứng từ từ chối cho vay của ngân hàng khi xin hoàn cọc</td>
              <td>Yêu cầu hoàn cọc với lý do vay thất bại nhưng không đính kèm link tài liệu</td>
            </tr>
            <tr>
              <td><code>ERR_UI_071</code></td>
              <td>400 Bad Request</td>
              <td>Đơn hoàn cọc đã được xử lý hoặc không hợp lệ</td>
              <td>Gửi yêu cầu hoàn cọc trên đơn hàng đã được hoàn cọc trước đó</td>
            </tr>
            <tr>
              <td><code>ERR_UI_080</code></td>
              <td>409 Conflict</td>
              <td>Xe đã được giữ chỗ hoặc đang trong giao dịch khác</td>
              <td>Gọi <code>manual-vin-hold</code> trên xe đang bị LOCKED</td>
            </tr>
            <tr>
              <td><code>ERR_UI_090</code></td>
              <td>400 Bad Request</td>
              <td>Chuyển trạng thái vi phạm State Machine</td>
              <td>Đổi trạng thái Trade-In từ SUBMITTED nhảy cóc sang CONTRACT_SIGNED</td>
            </tr>
            <tr>
              <td><code>ERR_UI_100</code></td>
              <td>400 Bad Request</td>
              <td>Tỷ lệ chiết khấu vượt quá trần quy định (Tối đa 10.00%)</td>
              <td>Cập nhật cấu hình chiết khấu: <code>maxDiscountPercentage: "15.0"</code></td>
            </tr>
            <tr>
              <td><code>ERR_UI_101</code></td>
              <td>403 Forbidden</td>
              <td>Không có quyền thực thi thao tác (Forbidden)</td>
              <td>Tài khoản Sale hoặc Manager gọi API <code>/api/v1/system/configs</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB 5: SCENARIOS -->
      <div id="tab-scenarios" class="qa-tab-content">
        <h3 style="margin-bottom: 8px; font-size: 16px;">6 Kịch bản Kiểm thử Tích hợp (End-to-End QA Test Cases)</h3>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Hướng dẫn từng bước giúp tester thực hiện kiểm thử tự động hoặc thủ công:</p>

        <div class="workflow-grid">
          <div class="workflow-card">
            <h4>Kịch bản 1: Đăng ký &amp; Bảo mật thông tin CCCD</h4>
            <ol class="step-list">
              <li>Gửi OTP tới số điện thoại qua <code>POST /api/v1/auth/otp/send</code> (Kiểm tra nhận mã sandbox <code>888888</code>).</li>
              <li>Đăng ký tài khoản khách hàng mới qua <code>POST /api/v1/auth/register</code>.</li>
              <li>Đăng nhập tài khoản qua <code>POST /api/v1/auth/login</code> &rarr; Nhận token JWT.</li>
              <li>Cập nhật số CCCD 12 chữ số qua <code>PUT /api/v1/users/profile</code>.</li>
              <li>Gọi <code>GET /api/v1/users/profile</code>: Xác minh số CCCD đã được che mặt nạ (ví dụ <code>0012****1234</code>).</li>
              <li>Dùng tài khoản Admin gọi <code>POST /api/v1/audit/decrypt-pii</code> để giải mã CCCD gốc và kiểm tra log phát sinh tại <code>GET /api/v1/audit/logs</code>.</li>
            </ol>
          </div>

          <div class="workflow-card">
            <h4>Kịch bản 2: Đặt cọc xe &amp; Mô phỏng Thanh toán Webhook</h4>
            <ol class="step-list">
              <li>Tra cứu danh mục xe <code>GET /api/v1/catalog/models</code> &amp; chi tiết <code>/api/v1/catalog/variants/{id}</code>.</li>
              <li>Tạo đơn cọc qua <code>POST /api/v1/orders/deposit</code> &rarr; Nhận <code>orderId</code>, <code>transactionRef</code>.</li>
              <li>Mở stream SSE qua <code>GET /api/v1/payments/stream?orderId=...</code> để theo dõi tiến trình thanh toán thời gian thực.</li>
              <li>Gửi Webhook thanh toán thành công <code>POST /api/v1/payments/mock-webhook</code> với <code>result: "SUCCESS"</code>.</li>
              <li>Xác minh order chuyển trạng thái sang <strong>DEPOSIT_PAID</strong> và thanh toán hoàn tất.</li>
              <li><em>Kiểm thử tiêu cực:</em> Gửi Webhook với <code>result: "FAILED"</code> và xác minh hệ thống nhả Soft Lock Quota.</li>
            </ol>
          </div>

          <div class="workflow-card">
            <h4>Kịch bản 3: Vay ngân hàng &amp; Đổi ngân hàng đối tác</h4>
            <ol class="step-list">
              <li>Tạo đơn hàng hình thức trả góp (<code>purchaseType: "INSTALLMENT"</code>).</li>
              <li>Thực hiện đổi ngân hàng lần 1 &amp; 2 qua <code>POST /api/v1/loans/{id}/switch-bank</code>.</li>
              <li>Thử đổi ngân hàng lần thứ 4 &rarr; Xác minh trả về lỗi <code>ERR_UI_051</code> (vượt quá 3 lần).</li>
              <li>Kích hoạt phê duyệt tự động từ phía ngân hàng Sandbox qua <code>POST /api/v1/mock/bank-decision</code> với <code>decision: "APPROVED"</code>.</li>
              <li>Kiểm tra trạng thái đơn được nâng cấp lên <strong>APPROVED</strong>.</li>
            </ol>
          </div>

          <div class="workflow-card">
            <h4>Kịch bản 4: Đổi xe cũ thu mua (Trade-In Lifecycle)</h4>
            <ol class="step-list">
              <li>Khách gửi xe cũ thẩm định qua <code>POST /api/v1/trade-in/submit</code>.</li>
              <li>Sale cập nhật sang <strong>APPRAISING</strong> qua <code>PATCH /api/v1/trade-in/{id}/status</code>.</li>
              <li>Showroom đưa giá thu mua <strong>OFFERED</strong> kèm <code>appraisedPrice: 450000000</code>.</li>
              <li>Khách chấp nhận &rarr; <strong>ACCEPTED</strong> &rarr; Ký hợp đồng <strong>CONTRACT_SIGNED</strong>.</li>
              <li>Khấu trừ vào đơn xe mới: chuyển sang <strong>CREDITED_TO_ORDER</strong>.</li>
              <li><em>Kiểm thử tiêu cực:</em> Thử nhảy cóc trạng thái và bắt lỗi <code>ERR_UI_090</code>.</li>
            </ol>
          </div>

          <div class="workflow-card">
            <h4>Kịch bản 5: Quy trình Hoàn cọc 2 Cấp (Manager &rarr; Admin)</h4>
            <ol class="step-list">
              <li>Khách tạo yêu cầu hoàn cọc qua <code>POST /api/v1/refunds/request</code> (Bắt buộc đính kèm link chứng từ bị ngân hàng từ chối vay).</li>
              <li>Đơn ở trạng thái ban đầu: <strong>PENDING_MANAGER</strong>.</li>
              <li>Đăng nhập quyền Showroom Manager duyệt Cấp 1 qua <code>POST /api/v1/refunds/{id}/decision</code> &rarr; Chuyển sang <strong>PENDING_ADMIN</strong>.</li>
              <li>Đăng nhập quyền Super Admin duyệt Cấp 2 &rarr; Chuyển sang <strong>COMPLETED</strong> và đơn hàng cập nhật <strong>REFUNDED</strong>.</li>
            </ol>
          </div>

          <div class="workflow-card">
            <h4>Kịch bản 6: Giữ xe VIN 24h &amp; Báo cáo Sự cố Vận chuyển</h4>
            <ol class="step-list">
              <li>Manager tra cứu tồn kho qua <code>GET /api/v1/inventory/vehicles</code>.</li>
              <li>Thực hiện giữ chỗ VIN xe trong 24h qua <code>POST /api/v1/inventory/manual-vin-hold</code> &rarr; Trạng thái xe thành <strong>LOCKED</strong>.</li>
              <li>Thực hiện điều chuyển xe giữa 2 showroom qua <code>POST /api/v1/inventory/transfers</code> &rarr; Xe chuyển <strong>TRANSFERRING</strong>.</li>
              <li>Báo cáo va quẹt trầy xước trong vận chuyển qua <code>POST /api/v1/inventory/transfers/{id}/damage-report</code> &rarr; Xe tự động cách ly thành <strong>TRANSIT_DAMAGED</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- SWAGGER UI CONTAINER -->
  <main id="swagger-ui"></main>

  <!-- TOAST NOTIFICATION -->
  <div id="toast">Đã sao chép vào bộ nhớ tạm!</div>

  <!-- SCRIPTS -->
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    // Embedded OpenAPI Specification
    const spec = SPEC_PLACEHOLDER;

    // Auto-detect current server origin to eliminate CORS issues
    if (window.location.protocol.startsWith("http")) {
      spec.servers = [
        { url: window.location.origin, description: "Current Server (" + window.location.origin + ")" },
        { url: "https://training-car-sell-system.vercel.app", description: "Vercel Production Environment" },
        { url: "http://localhost:3000", description: "Local Development Server" }
      ];
    } else {
      // File protocol banner
      window.addEventListener("DOMContentLoaded", () => {
        const banner = document.createElement("div");
        banner.style.cssText = "background: #fee2e2; border: 2px solid #ef4444; color: #991b1b; padding: 14px 20px; margin: 15px auto; max-width: 1440px; border-radius: 10px; font-weight: 600; font-size: 13.5px; box-shadow: 0 4px 12px rgba(239,68,68,0.15);";
        banner.innerHTML = `
          ⚠️ <strong>LƯU Ý CORS DÀNH CHO TESTER:</strong> Bạn đang mở Swagger bằng giao thức <code>file:///</code>.<br>
          Trình duyệt (Chrome/Edge/Safari) sẽ chặn mọi request "Try it out" từ <code>file:///</code> tới server HTTPS do vi phạm bảo mật CORS (Lỗi <em>"Failed to fetch / URL scheme must be http or https"</em>).<br>
          👉 <strong>Cách khắc phục:</strong> Vui lòng truy cập Swagger qua đường dẫn HTTP/HTTPS của ứng dụng: <a href="http://localhost:3000/api-docs" target="_blank" style="color: #2563eb; text-decoration: underline;">http://localhost:3000/api-docs</a> hoặc <a href="https://training-car-sell-system.vercel.app/api-docs" target="_blank" style="color: #2563eb; text-decoration: underline;">https://training-car-sell-system.vercel.app/api-docs</a>!
        `;
        document.querySelector(".qa-hub-container").prepend(banner);
      });
    }

    window.onload = function() {
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        tryItOutEnabled: true,
      });
    };

    function toggleQAPanel() {
      const panel = document.getElementById('qaPanel');
      const icon = document.getElementById('qaToggleIcon');
      const nav = panel.querySelector('.qa-nav');
      const contents = panel.querySelectorAll('.qa-tab-content');

      const isCollapsed = nav.style.display === 'none';
      if (isCollapsed) {
        nav.style.display = 'flex';
        contents.forEach(c => {
          if (c.classList.contains('active')) c.style.display = 'block';
        });
        icon.innerText = '▼ Thu gọn';
      } else {
        nav.style.display = 'none';
        contents.forEach(c => c.style.display = 'none');
        icon.innerText = '▶ Mở rộng';
      }
    }

    function switchQATab(e, tabId) {
      document.querySelectorAll('.qa-tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.qa-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });

      e.currentTarget.classList.add('active');
      const activeContent = document.getElementById(tabId);
      activeContent.classList.add('active');
      activeContent.style.display = 'block';
    }

    function copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép: ' + text);
      });
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 2500);
    }

    function toggleDarkMode() {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      document.getElementById('themeText').innerText = isDark ? 'Light Mode' : 'Dark Mode';
    }

    function downloadSpec() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spec, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "autodealer-openapi-v25.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Đang tải xuống autodealer-openapi-v25.json');
    }
  </script>
</body>
</html>
"""

final_html = html_template.replace("SPEC_PLACEHOLDER", spec_json_str)

with open("public/swagger.html", "w", encoding="utf-8") as f:
    f.write(final_html)

with open("public/api-docs.html", "w", encoding="utf-8") as f:
    f.write(final_html)

with open("public/index-swagger.html", "w", encoding="utf-8") as f:
    f.write(final_html)

print("Generated standalone HTML files with CORS auto-detection successfully.")
