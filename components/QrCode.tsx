import React, { useMemo } from 'react';
import { createQrMatrix, type QrEcc } from '../lib/qrcode';
import { cn } from './ui/Common';

type Props = {
  data: string;
  ecc?: QrEcc;
  size?: number;
  margin?: number;
  className?: string;
};

export const QrCode: React.FC<Props> = ({ data, ecc = 'M', size = 176, margin = 4, className }) => {
  const matrix = useMemo(() => createQrMatrix(data, ecc), [data, ecc]);
  const n = matrix.length;
  const view = n + margin * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${view} ${view}`}
      className={cn('rounded-lg bg-white', className)}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code"
    >
      <rect width={view} height={view} fill="white" />
      {matrix.map((row, y) =>
        row.map((dark, x) =>
          dark ? (
            <rect key={`${x}-${y}`} x={x + margin} y={y + margin} width={1} height={1} fill="black" />
          ) : null
        )
      )}
    </svg>
  );
};

