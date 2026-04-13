export const GOOGLE_MAP_OPTIONS = [
  {
    value: '1_SHOWROOM',
    label: 'Shop 1',
    address: 'Ngõ 12 Quang Trung- Hà Đông-Hà Nội',
    mapUrl: 'https://maps.app.goo.gl/Koafe6aCw1M6eTTD6',
    mapEmbedUrl: 'https://www.google.com/maps?q=Ngõ%2012%20Quang%20Trung%20H%C3%A0%20%C4%90%C3%B4ng%20H%C3%A0%20N%E1%BB%99i&output=embed',
  },
  {
    value: '2_SHOWROOM',
    label: 'Shop 2',
    address: 'Số 3 Dương Khuê, Mai Dịch, Cầu Giấy, Hà Nội',
    mapUrl: 'https://maps.app.goo.gl/XpNseqgYzoy822gYA',
    mapEmbedUrl: 'https://www.google.com/maps?q=S%E1%BB%91%203%20D%C6%B0%C6%A1ng%20Khu%C3%AA%20Mai%20D%E1%BB%8Bch%20C%E1%BA%A7u%20Gi%E1%BA%A5y%20H%C3%A0%20N%E1%BB%99i&output=embed',
  },
];

export function getGoogleMapByValue(value) {
  // Resolve selected map configuration by stored value.
  return GOOGLE_MAP_OPTIONS.find((item) => item.value === value) || null;
}

export function getGoogleMapEmbedUrl(mapConfig) {
  // Resolve iframe-safe map URL, fallback by address query.
  if (!mapConfig) return '';
  if (mapConfig.mapEmbedUrl) return mapConfig.mapEmbedUrl;
  if (mapConfig.address) {
    return `https://www.google.com/maps?q=${encodeURIComponent(mapConfig.address)}&output=embed`;
  }
  return '';
}
