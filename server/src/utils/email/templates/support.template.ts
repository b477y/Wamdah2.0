const supportTemplate = () => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #0b0f1c;
      color: #ffffff;
      padding: 20px;
    }
    .container {
      background: #1a1f30;
      border-radius: 10px;
      padding: 30px;
      text-align: center;
    }
    .title {
      font-size: 22px;
      font-weight: bold;
      color: #ffcc00;
    }
    .message {
      margin-top: 20px;
      font-size: 15px;
      color: #dddddd;
    }
    .footer {
      margin-top: 30px;
      font-size: 14px;
      color: #888;
    }
    .logo {
      height: 200px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://res.cloudinary.com/dlt1zyqli/image/upload/v1746542906/logo_khd34l.png" alt="Wamdah Logo" class="logo" />
    <div class="title">We Got Your Message!</div>
    <div class="message">
      Thanks for reaching out to Wamdah. Our support team has received your request and will contact you as soon as possible.
    </div>
    <div class="footer">You’re in good hands — Wamdah Support Team</div>
  </div>
</body>
</html>
`;
};

export default supportTemplate;
