const subscribeTemplate = ({ email } = {}) => {
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
      font-size: 24px;
      font-weight: bold;
      color: #ffcc00;
    }
    .message {
      margin-top: 20px;
      font-size: 16px;
      color: #dddddd;
    }
    .footer {
      margin-top: 30px;
      font-size: 14px;
      color: #888;
    }
    .logo {
      height: 250px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://res.cloudinary.com/dlt1zyqli/image/upload/v1746542906/logo_khd34l.png" alt="Wamdah Logo" class="logo" />
    <div class="title">Welcome to Wamdah!</div>
    <div class="message">
      We're excited to let you know that the email <strong>${email}</strong> has successfully subscribed to our newsletter. Stay tuned for updates and exclusive content!
    </div>
    <div class="footer">The Wamdah Team</div>
  </div>
</body>
</html>
`;
};

export default subscribeTemplate;
