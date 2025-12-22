// 이미지 URL 생성 헬퍼 함수
// 네트워크 환경에서도 정상 동작하도록 개선
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // 이미 전체 URL인 경우 그대로 반환
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 백엔드 URL 결정 (네트워크 환경 고려)
  const getBackendUrl = () => {
    // 프로덕션 환경에서는 현재 origin 사용 (프론트엔드와 백엔드가 같은 서버에서 서빙)
    if (import.meta.env.PROD) {
      return window.location.origin;
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 환경 변수가 설정되어 있으면 우선 사용
    if (import.meta.env.VITE_API_BASE_URL) {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      // /api를 제거하여 백엔드 기본 URL 얻기
      const baseUrl = apiUrl.replace('/api', '').replace(/\/$/, '');
      if (baseUrl) {
        console.log('📷 Using VITE_API_BASE_URL for image:', baseUrl);
        return baseUrl;
      }
    }
    
    // localhost가 아닌 경우 (네트워크 접속)
    // 프론트엔드와 같은 IP, 포트 3000 사용
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // HTTP 프로토콜 사용 (백엔드는 HTTP)
      const url = `http://${hostname}:3000`;
      console.log('📷 Using network hostname for image:', url);
      return url;
    }
    
    // localhost인 경우
    const url = 'http://localhost:3000';
    console.log('📷 Using localhost for image:', url);
    return url;
  };
  
  const backendUrl = getBackendUrl();
  
  // imagePath가 이미 /로 시작하는지 확인
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const fullUrl = `${backendUrl}${normalizedPath}`;
  
  // 개발 환경에서만 로그 출력 (너무 많은 로그 방지)
  if (import.meta.env.DEV) {
    console.log('📷 Generated image URL:', fullUrl, 'from path:', imagePath);
  }
  
  return fullUrl;
};

