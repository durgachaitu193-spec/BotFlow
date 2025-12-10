// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

interface Params {
  text: string;
  startChars: number;
  endChars: number;
  separator?: string;
}

export function shortenAddress({
  text = "",
  startChars,
  endChars,
  separator = "...",
}: Params): string {
  const maxLength = startChars + endChars;

  return text?.length > maxLength
    ? `${text.slice(0, startChars)}${separator}${text.slice(-endChars)}`
    : text;
}
