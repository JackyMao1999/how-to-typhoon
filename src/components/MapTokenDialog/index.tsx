import React, { useState } from 'react';
import { saveAmapKey } from '../../utils/token';

interface Props {
  onTokenSaved: () => void;
}

export function MapTokenDialog({ onTokenSaved }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    const key = value.trim();
    if (!key) {
      setError('请输入有效的高德地图 Key');
      return;
    }
    saveAmapKey(key);
    onTokenSaved();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-dark-bg">
      <div className="bg-dark-surface border border-gray-700/50 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🌀</div>
          <h1 className="text-xl font-bold text-white mb-2">台风模拟与预警系统</h1>
          <p className="text-sm text-gray-400">
            首次使用请配置高德地图 Key
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              高德 JS API Key
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="请输入 Key..."
              className="w-full bg-dark-bg border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-typhoon-lv7 transition-colors font-mono"
              autoFocus
            />
            {error && <p className="text-typhoon-lv12 text-xs mt-1">{error}</p>}
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-typhoon-lv7/20 hover:bg-typhoon-lv7/30 text-typhoon-lv7 border border-typhoon-lv7/30 rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            确认并进入
          </button>

          <p className="text-xs text-gray-600 text-center leading-relaxed">
            没有 Key？前往{' '}
            <a
              href="https://console.amap.com/dev/key/app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-typhoon-lv7 hover:underline"
            >
              高德开放平台
            </a>{' '}
            注册应用获取（免费）
          </p>
        </div>
      </div>
    </div>
  );
}
