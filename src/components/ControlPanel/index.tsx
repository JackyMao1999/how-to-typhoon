import React from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';
import { useUIStore } from '../../store/uiStore';

const PARAM_INFO: Record<string, { title: string; desc: string; effect: string }> = {
  subtropicalHighStrength: {
    title: '副高强度',
    desc: '副热带高压是西北太平洋台风移动的主要引导气流。强度越大，台风路径越稳定、移动速度越快。',
    effect: '当前值 × 5 ≈ 对台风施加的引导力 (km/h)',
  },
  subtropicalHighDirection: {
    title: '副高方向',
    desc: '副高外围的东南侧气流引导台风向西北移动。270°=偏西, 315°=西北, 0°=偏北。台风通常沿副高边缘呈抛物线路径。',
    effect: '影响台风转向点的位置',
  },
  seaSurfaceTemp: {
    title: '海面温度',
    desc: '台风需要 >26.5°C 的暖海面才能维持强度。海面温度越高，水汽蒸发越强，台风能量越充足。自动模式下随纬度变化：赤道29°C ~ 45°N 22°C。',
    effect: '低于26.5°C开始衰减，低于24°C快速消散',
  },
  landTemperature: {
    title: '陆地温度',
    desc: '台风登陆后受陆地温度影响。温度越高大气越不稳定，衰减越慢。自动模式下随纬度变化：赤道31°C ~ 45°N 22°C。',
    effect: '高温减缓衰减，低温加速消散',
  },
  frictionCoefficient: {
    title: '摩擦系数',
    desc: '模拟地面对台风的摩擦衰减。自动模式下：海上=0.1, 陆地=0.7。系数越大，登陆后风速衰减越快。',
    effect: '海上摩擦≈0.1-0.2, 陆地上≈0.5-0.8',
  },
};

type AutoKey = 'seaSurfaceTemp' | 'landTemperature' | 'frictionCoefficient' | 'subtropicalHighStrength' | 'subtropicalHighDirection';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function ControlPanel() {
  const updateEngineConfig = useTyphoonStore((s) => s.updateEngineConfig);
  const engineConfig = useTyphoonStore((s) => s.engineConfig);
  const autoOverrides = useTyphoonStore((s) => s.autoOverrides);
  const toggleAutoOverride = useTyphoonStore((s) => s.toggleAutoOverride);
  const season = useTyphoonStore((s) => s.season);
  const setSeason = useTyphoonStore((s) => s.setSeason);

  const showParticles = useUIStore((s) => s.showParticles);
  const showWindCircles = useUIStore((s) => s.showWindCircles);
  const showWindField = useUIStore((s) => s.showWindField);
  const showPath = useUIStore((s) => s.showPath);
  const showPrediction = useUIStore((s) => s.showPrediction);
  const toggleParticles = useUIStore((s) => s.toggleParticles);
  const toggleWindCircles = useUIStore((s) => s.toggleWindCircles);
  const toggleWindField = useUIStore((s) => s.toggleWindField);
  const togglePath = useUIStore((s) => s.togglePath);
  const togglePrediction = useUIStore((s) => s.togglePrediction);

  const [open, setOpen] = React.useState(false);

  const sliders: { key: string; label: string; value: number; min: number; max: number; step: number; suffix?: string; autoKey: AutoKey }[] = [
    { key: 'subtropicalHighStrength', label: '副高强度', value: engineConfig.subtropicalHighStrength, min: 0, max: 20, step: 0.5, autoKey: 'subtropicalHighStrength' },
    { key: 'subtropicalHighDirection', label: '副高方向', value: engineConfig.subtropicalHighDirection, min: 0, max: 360, step: 5, autoKey: 'subtropicalHighDirection' },
    { key: 'seaSurfaceTemp', label: '海面温度', value: engineConfig.seaSurfaceTemp, min: 20, max: 32, step: 0.5, suffix: '°C', autoKey: 'seaSurfaceTemp' },
    { key: 'landTemperature', label: '陆地温度', value: engineConfig.landTemperature, min: 18, max: 34, step: 0.5, suffix: '°C', autoKey: 'landTemperature' },
    { key: 'frictionCoefficient', label: '摩擦系数', value: engineConfig.frictionCoefficient, min: 0, max: 1, step: 0.05, autoKey: 'frictionCoefficient' },
  ];

  return (
    <div className="absolute top-12 right-4 z-10">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="bg-dark-surface/90 backdrop-blur-md border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
          {open ? '✕ 关闭' : '⚙ 控制'}
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-1.5 bg-dark-surface/95 backdrop-blur-md border border-gray-700/50 rounded-lg p-4 min-w-[280px] font-mono text-sm space-y-4 shadow-xl">
            <div>
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">环境参数</h3>
              <div className="space-y-2">
                {sliders.map(({ key, label, value, min, max, step, suffix, autoKey }) => (
                  <SliderRow key={key} label={label} value={value} min={min} max={max} step={step} suffix={suffix}
                    autoOn={autoOverrides[autoKey]} info={PARAM_INFO[key]}
                    onChange={(v) => { if (autoOverrides[autoKey]) toggleAutoOverride(autoKey); updateEngineConfig({ [key]: v } as any); }}
                    onToggleAuto={() => toggleAutoOverride(autoKey)} />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-700/30">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">季节模式</h3>
              <div className="flex gap-1 mt-1">
                {SEASONS.map((s) => (
                  <button key={s} onClick={() => setSeason(s)}
                    className={`flex-1 text-[10px] font-bold py-1 rounded border transition-colors ${
                      season === s
                        ? 'bg-typhoon-lv7/30 text-typhoon-lv7 border-typhoon-lv7/50'
                        : 'bg-dark-bg/50 text-gray-500 border-gray-700/30 hover:border-gray-500'
                    }`}>
                    {{ spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-700/30">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">图层切换</h3>
              <div className="space-y-1">
                <Toggle label="粒子系统" checked={showParticles} onChange={toggleParticles} />
                <Toggle label="风场" checked={showWindField} onChange={toggleWindField} />
                <Toggle label="风圈" checked={showWindCircles} onChange={toggleWindCircles} />
                <Toggle label="路径预测" checked={showPrediction} onChange={togglePrediction} />
                <Toggle label="历史路径" checked={showPath} onChange={togglePath} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoIcon({ info }: { info: { title: string; desc: string; effect: string } }) {
  return (
    <span className="group relative inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-500 text-gray-400 text-[10px] cursor-help ml-1 hover:border-typhoon-lv7 hover:text-typhoon-lv7 transition-colors leading-none shrink-0">
      !
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 p-2.5 bg-dark-bg border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-20">
        <div className="text-typhoon-lv7 text-xs font-bold mb-1">{info.title}</div>
        <div className="text-gray-300 text-[10px] leading-relaxed mb-1">{info.desc}</div>
        <div className="text-gray-500 text-[9px] italic">💡 {info.effect}</div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px w-2 h-2 bg-dark-bg border-l border-t border-gray-600 rotate-45" />
      </div>
    </span>
  );
}

function SliderRow({ label, value, min, max, step, suffix = '', autoOn, info, onChange, onToggleAuto }: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string;
  autoOn: boolean; info: { title: string; desc: string; effect: string };
  onChange: (v: number) => void; onToggleAuto: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400 text-xs w-auto min-w-[40px] shrink-0 flex items-center">
        {label}<InfoIcon info={info} />
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-typhoon-lv7 min-w-0" />
      <span className="text-gray-300 text-[10px] w-10 text-right shrink-0">
        {step >= 1 ? value.toFixed(0) : value.toFixed(step >= 0.5 ? 1 : 2)}{suffix}
      </span>
      <button onClick={(e) => { e.stopPropagation(); onToggleAuto(); }}
        className={`text-[9px] font-bold rounded px-1.5 py-0.5 border transition-colors shrink-0 ${
          autoOn ? 'bg-green-900/30 text-green-400 border-green-700/40' : 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40'
        }`}>
        {autoOn ? 'A' : 'M'}
      </button>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-typhoon-lv7" />
      {label}
    </label>
  );
}
