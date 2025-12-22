// 이메일 형식 검증 (프론트엔드) - s25047 형식만 허용 (@gsm.hs.kr 도메인만)
export const validateEmail = (email) => {
  if (!email) return false;
  
  // s25047 형식 (학번 형식)만 허용
  const studentNumberRegex = /^s\d{5}$/i;
  return studentNumberRegex.test(email);
};

// 이메일 검증 메시지
export const getEmailError = (email) => {
  if (!email) {
    return '이메일을 입력해주세요.';
  }
  if (!validateEmail(email)) {
    return '올바른 이메일 형식을 입력해주세요. (예: s25047)';
  }
  return null;
};

// 비밀번호 검증
export const validatePassword = (password) => {
  if (!password) {
    return '비밀번호를 입력해주세요.';
  }
  if (password.length < 6) {
    return '비밀번호는 6자 이상이어야 합니다.';
  }
  return null;
};

// 닉네임 검증
export const validateNickname = (nickname) => {
  if (!nickname) {
    return '닉네임을 입력해주세요.';
  }
  if (nickname.length < 2) {
    return '닉네임은 2자 이상이어야 합니다.';
  }
  return null;
};


