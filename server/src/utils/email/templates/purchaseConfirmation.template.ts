const purchaseConfirmationTemplate = ({ name, credits } = {}) => {
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
        height: 250px;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img src="https://res.cloudinary.com/dlt1zyqli/image/upload/v1746542906/logo_khd34l.png" alt="Wamdah Logo" class="logo" />
      <div class="title">Hello ${name}, Credits Added Successfully!</div>
      <div class="message">
        Your purchase was successful. <strong>${credits} credits</strong> have been added to your Wamdah account. Go create something amazing!
      </div>
      <div class="footer">Thank you for using Wamdah.</div>
    </div>
  </body>
  </html>`;
  };
  
  export default purchaseConfirmationTemplate;
  
