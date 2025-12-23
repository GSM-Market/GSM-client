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
  if (password.length < 8) {
    return '비밀번호는 8자 이상이어야 합니다.';
  }
  
  // 숫자 포함 확인
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return '비밀번호에 숫자를 포함해주세요.';
  }
  
  // 문자 포함 확인 (영문 대소문자)
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    return '비밀번호에 영문자를 포함해주세요.';
  }
  
  // 특수문자 포함 확인
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSpecialChar) {
    return '비밀번호에 특수문자를 포함해주세요.';
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


