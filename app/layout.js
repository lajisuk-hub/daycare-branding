import "./globals.css";

export const metadata = {
  title: "어린이집 브랜딩 구축하기",
  description: "우리 어린이집의 마음이 담긴 인스타그램 프로필 소개글을 만들어 드립니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
