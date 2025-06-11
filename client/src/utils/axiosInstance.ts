import axios from 'axios';

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080', // 백엔드 API 기본 URL
  withCredentials: true, // 쿠키(refresh token)를 포함하여 요청을 보냄
});

// 재발급 요청이 진행 중인지 여부를 추적
let isRefreshing = false;
// 재발급 후 재시도할 보류 중인 요청들
let failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void; }[] = [];

// 실패한 요청들을 큐에 추가하고, 토큰 재발급이 완료되면 다시 실행
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. 요청 인터셉터: 모든 요청에 Access Token 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. 응답 인터셉터: Access Token 만료 시 재발급 로직
axiosInstance.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환
  async (error) => {
    const originalRequest = error.config;

    // Access Token 만료 에러 (401 Unauthorized) 이고, 재시도 플래그가 없으며, 재발급 요청이 아닌 경우
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/reissue') {
      originalRequest._retry = true; // 재시도 플래그 설정 (무한 루프 방지)

      // 리프레시 토큰 요청이 이미 진행 중이면, 현재 요청을 큐에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest); // 새 토큰으로 원본 요청 재시도
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true; // 재발급 요청 시작

      try {
        // Access Token 재발급 요청
        // 이 요청은 HTTP Only 쿠키에 있는 refresh token을 자동으로 백엔드로 보냄
        const response = await axios.post('http://localhost:8080/api/auth/reissue', {}, { withCredentials: true });
        const newAccessToken = response.data.accessToken;

        localStorage.setItem('accessToken', newAccessToken); // 새로 받은 Access Token 저장

        // 큐에 있던 모든 실패한 요청들을 새 토큰으로 재실행
        processQueue(null, newAccessToken);

        // 원본 요청의 Authorization 헤더를 새 토큰으로 업데이트
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest); // 업데이트된 요청으로 재시도
      } catch (reissueError: any) {
        // 리프레시 토큰도 만료되었거나 유효하지 않은 경우
        console.error('Failed to re-issue access token:', reissueError);
        localStorage.removeItem('accessToken'); // 유효하지 않은 토큰 삭제
        // 큐에 있던 모든 실패한 요청들에게 에러 전달
        processQueue(reissueError, null);

        // 사용자에게 재로그인 요청 (예: 로그인 페이지로 리다이렉트)
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/'; // 로그인 페이지 경로로 변경
        return Promise.reject(reissueError); // 에러 전파
      } finally {
        isRefreshing = false; // 재발급 요청 완료
      }
    }

    // 401이 아닌 다른 에러나 이미 재시도된 요청은 그대로 반환
    return Promise.reject(error);
  }
);

export default axiosInstance; // 설정된 Axios 인스턴스 내보내기