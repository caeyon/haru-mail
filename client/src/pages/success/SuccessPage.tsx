// src/pages/SuccessPage/SuccessPage.tsx
import React, { useEffect, useState } from 'react';

interface UserInfo {
  email: string;
  username: string;
}

const SuccessPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + getAccessTokenFromCookies(),
      },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: UserInfo) => {
        setUser(data);
      })
      .catch((err) => {
        console.error('Error fetching user info:', err);
      });
  }, []);

  const getAccessTokenFromCookies = (): string => {
    const name = 'accessToken=';
    const decoded = decodeURIComponent(document.cookie);
    return decoded
      .split('; ')
      .find((row) => row.startsWith(name))
      ?.substring(name.length) ?? '';
  };

  const handleSendTestEmail = () => {
    fetch('http://localhost:8080/api/mail/send', { // 테스트 전용 엔드포인트로 변경
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + getAccessTokenFromCookies(),
      },
      credentials: 'include',
    })
      .then((response) => {
        if (response.ok) {
          alert('테스트 메일 발송 요청 성공!');
        } else {
          return response.json().then((data) => {
            alert(`테스트 메일 발송 요청 실패: ${data.message || response.statusText}`);
          });
        }
      })
      .catch((error) => {
        console.error('테스트 메일 발송 오류:', error);
        alert('테스트 메일 발송 중 오류가 발생했습니다.');
      });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Email: {user.email}</p>
      <button onClick={handleSendTestEmail}>오늘의 일기 메일로 보내기</button>
    </div>
  );
};

export default SuccessPage;