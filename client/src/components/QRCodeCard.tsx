import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeCardProps {
  joinUrl: string;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export function QRCodeCard({ joinUrl, compact = false, onClick, className }: QRCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: compact ? 180 : 280,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    }).then(setQrDataUrl);
  }, [compact, joinUrl]);

  if (compact) {
    return (
      <button className={`qr-mini ${className ?? ''}`} type="button" onClick={onClick} aria-label="Mở mã QR tham gia">
        {qrDataUrl ? <img src={qrDataUrl} alt="Mã QR tham gia phiên karaoke" /> : <span />}
      </button>
    );
  }

  return (
    <section className={`qr-dialog-card ${className ?? ''}`}>
      <div>
        <h2>Quét mã để tham gia</h2>
        <p>Mở camera trên điện thoại, quét mã này và thêm bài hát vào hàng chờ.</p>
      </div>
      {qrDataUrl ? <img src={qrDataUrl} alt="Mã QR tham gia phiên karaoke" /> : <div className="qr-placeholder" />}
      <a href={joinUrl}>{joinUrl}</a>
    </section>
  );
}
