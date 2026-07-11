export interface GeoLabel {
  name: string;
  lat: number;
  lng: number;
  size: number;
}

export const OCEAN_LABELS: GeoLabel[] = [
  { name: '太平洋', lat: 0, lng: 170, size: 14 },
  { name: '北太平洋', lat: 35, lng: -170, size: 11 },
  { name: '南太平洋', lat: -30, lng: -140, size: 11 },
  { name: '大西洋', lat: 5, lng: -35, size: 14 },
  { name: '北大西洋', lat: 40, lng: -45, size: 11 },
  { name: '南大西洋', lat: -30, lng: -20, size: 11 },
  { name: '印度洋', lat: -10, lng: 65, size: 13 },
  { name: '北冰洋', lat: 82, lng: 0, size: 11 },
  { name: '南海', lat: 14, lng: 115, size: 10 },
  { name: '东海', lat: 28, lng: 125, size: 10 },
  { name: '黄海', lat: 36, lng: 123, size: 10 },
  { name: '日本海', lat: 40, lng: 135, size: 10 },
  { name: '菲律宾海', lat: 18, lng: 135, size: 11 },
  { name: '阿拉伯海', lat: 18, lng: 65, size: 10 },
  { name: '孟加拉湾', lat: 15, lng: 88, size: 10 },
  { name: '几内亚湾', lat: 2, lng: 5, size: 10 },
  { name: '地中海', lat: 37, lng: 18, size: 10 },
  { name: '加勒比海', lat: 16, lng: -78, size: 10 },
  { name: '白令海', lat: 58, lng: -175, size: 10 },
  { name: '鄂霍次克海', lat: 52, lng: 150, size: 10 },
];

export const CITY_LABELS: GeoLabel[] = [
  { name: '东京', lat: 35.7, lng: 139.7, size: 10 },
  { name: '上海', lat: 31.2, lng: 121.5, size: 10 },
  { name: '北京', lat: 39.9, lng: 116.4, size: 10 },
  { name: '首尔', lat: 37.6, lng: 127.0, size: 9 },
  { name: '马尼拉', lat: 14.6, lng: 121.0, size: 9 },
  { name: '台北', lat: 25.0, lng: 121.5, size: 9 },
  { name: '香港', lat: 22.3, lng: 114.2, size: 9 },
  { name: '新加坡', lat: 1.3, lng: 103.8, size: 9 },
  { name: '曼谷', lat: 13.8, lng: 100.5, size: 9 },
  { name: '河内', lat: 21.0, lng: 105.8, size: 9 },
  { name: '胡志明', lat: 10.8, lng: 106.7, size: 8 },
  { name: '雅加达', lat: -6.2, lng: 106.8, size: 9 },
  { name: '悉尼', lat: -33.9, lng: 151.2, size: 9 },
  { name: '孟买', lat: 19.1, lng: 72.9, size: 9 },
  { name: '迪拜', lat: 25.2, lng: 55.3, size: 9 },
  { name: '伦敦', lat: 51.5, lng: -0.1, size: 9 },
  { name: '莫斯科', lat: 55.8, lng: 37.6, size: 9 },
  { name: '开罗', lat: 30.0, lng: 31.2, size: 9 },
  { name: '开普敦', lat: -33.9, lng: 18.4, size: 9 },
  { name: '纽约', lat: 40.7, lng: -74.0, size: 9 },
  { name: '洛杉矶', lat: 34.1, lng: -118.2, size: 9 },
  { name: '墨西哥城', lat: 19.4, lng: -99.1, size: 9 },
  { name: '布宜诺斯', lat: -34.6, lng: -58.4, size: 8 },
  { name: '圣保罗', lat: -23.5, lng: -46.6, size: 9 },
  { name: '拉萨', lat: 29.7, lng: 91.1, size: 8 },
  { name: '爱丽丝泉', lat: -23.7, lng: 133.9, size: 8 },
  { name: '关岛', lat: 13.5, lng: 144.8, size: 8 },
  { name: '夏威夷', lat: 21.3, lng: -157.8, size: 9 },
  { name: '阿留申', lat: 53.0, lng: -168.0, size: 8 },
];
