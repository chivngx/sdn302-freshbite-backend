const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
const PHONE_REGEX = /^0[35789][0-9]{8}$/;

exports.validateRegister = (req, res, next) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const nameStr = String(fullName).trim();
  const emailStr = String(email).trim().toLowerCase();
  const phoneStr = String(phone).trim();
  const passStr = String(password);

  if (nameStr.length < 3 || nameStr.length > 50) {
    return res.status(400).json({ success: false, message: 'Full name must be between 3 and 50 characters' });
  }

  if (!EMAIL_REGEX.test(emailStr)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  if (!PHONE_REGEX.test(phoneStr)) {
    return res.status(400).json({ success: false, message: 'Phone must be a valid 10-digit mobile number' });
  }

  if (passStr.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  // chuan hoa va truyen du lieu sach vao req body
  req.body.fullName = nameStr;
  req.body.email = emailStr;
  req.body.phone = phoneStr;
  req.body.password = passStr;

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const emailStr = String(email).trim().toLowerCase();
  const passStr = String(password);

  if (!EMAIL_REGEX.test(emailStr)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  req.body.email = emailStr;
  req.body.password = passStr;

  next();
};

exports.validateUpdateProfile = (req, res, next) => {
  const { fullName, phone, avatar } = req.body;

  if (fullName !== undefined) {
    const nameStr = String(fullName).trim();
    if (nameStr.length < 3 || nameStr.length > 50) {
      return res.status(400).json({ success: false, message: 'Full name must be between 3 and 50 characters' });
    }
    req.body.fullName = nameStr;
  }

  if (phone !== undefined) {
    const phoneStr = String(phone).trim();
    if (!PHONE_REGEX.test(phoneStr)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }
    req.body.phone = phoneStr;
  }

  if (avatar !== undefined) {
    req.body.avatar = String(avatar).trim();
  }

  next();
};

exports.validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  const currentStr = String(currentPassword);
  const newStr = String(newPassword);

  if (newStr.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  if (currentStr === newStr) {
    return res.status(400).json({ success: false, message: 'New password cannot be the same as current password' });
  }

  req.body.currentPassword = currentStr;
  req.body.newPassword = newStr;

  next();
};