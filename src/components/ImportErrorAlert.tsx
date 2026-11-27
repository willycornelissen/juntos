import React from 'react';
import { ChamadaParseError } from '../domain/chamadaParser';

export interface AlertError {
  message: string;
  details?: string[];
}

export function toAlertError(
  err: unknown,
  fallbackMessage: string
): AlertError {
  if (err instanceof ChamadaParseError) {
    return {
      message: err.summary,
      details: err.details,
    };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: fallbackMessage };
}

export function ImportErrorAlert({
  error,
}: {
  error: AlertError | null;
}): React.ReactElement | null {
  if (!error) {
    return null;
  }

  return (
    <div className="warning" role="alert">
      <div>{error.message}</div>
      {error.details && error.details.length > 0 && (
        <ul className="warning-details">
          {error.details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
