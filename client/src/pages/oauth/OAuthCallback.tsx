import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// UserInfo 인터페이스는 컴포넌트 외부에 한 번만 정의
interface UserInfo {
  username: string;
  email: string;
}

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) 사용자 정보 호출 (쿠키는 fetch의 credentials: 'include' 옵션으로 자동 전송)
        const userRes = await fetch('http://localhost:8080/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 브라우저가 해당 도메인의 쿠키를 요청에 포함시킵니다.
        });

        if (!userRes.ok) {
          const errorText = await userRes.text();
          if (userRes.status === 401) {
             throw new Error('인증에 실패했습니다. 다시 로그인해주세요.');
          }
          throw new Error(`User fetch failed: ${userRes.status} - ${errorText}`);
        }
        const userData: UserInfo = await userRes.json();
        // setUser(userData); // 사용자 정보를 전역 상태에 저장 (Context, Redux 등)

        // 2) 로컬 스토리지에서 구독 설정 정보 가져오기
        const subscriptionFrequency = localStorage.getItem('subscription_frequency');
        const subscriptionAgreement = localStorage.getItem('subscription_agreement');

        // 3) 구독 설정 정보가 있으면 백엔드로 전송 (쿠키는 자동으로 전송)
        if (subscriptionFrequency && subscriptionAgreement) {
          const settingRes = await fetch('http://localhost:8080/api/user/setting', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // 쿠키를 포함하여 전송
            body: JSON.stringify({
              subscriptionFrequency,
              subscriptionAgreement: subscriptionAgreement === 'true',
            }),
          });

          if (!settingRes.ok) {
            const errorText = await settingRes.text();
            console.warn(`Failed to save subscription settings: ${settingRes.status} - ${errorText}`);
          }

          localStorage.removeItem('subscription_frequency');
          localStorage.removeItem('subscription_agreement');
        }

        // 4) 모든 처리가 완료되면 메인 페이지로 이동
        navigate('/list');

      } catch (err: any) {
        console.error('OAuth Callback Error:', err);
        setError(err.message || 'An unknown error occurred during login.');
        alert(`로그인 처리 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
        navigate('/'); // 에러 발생 시 홈 또는 로그인 페이지로 리다이렉트
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [navigate]); // `location.search`는 더 이상 필요 없으므로 제거

  if (loading) {
    return <div>로그인 처리 중...</div>;
  }

  if (error) {
    return <div>오류: {error}</div>;
  }

  return null;
};

export default OAuthCallback;