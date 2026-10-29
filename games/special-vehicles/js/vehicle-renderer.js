/**
 * 모듈형 SVG 차량 렌더러 (Data-Driven SVG Assembler)
 * - Chassis (구동부/바퀴)
 * - Body & Cabin (운전석/차체 본체 및 도색/데칼)
 * - Attachment (사다리, 방수포, 버킷, 크레인, 드럼, 덤프 등 핵심 기믹 파츠)
 */
class VehicleRenderer {
  // 차량 SVG 문자열 생성
  static renderSVG(vehicle, options = {}) {
    const width = options.width || 320;
    const height = options.height || 200;
    const isInteractive = options.interactive || false;
    const armAngle = options.armAngle || 0; // 사다리/붐대 각도 (-45 ~ 45도)
    const ladderExtension = options.ladderExtension || 0; // 사다리 연장 길이
    const bucketAngle = options.bucketAngle || 0; // 버킷 회전 각도
    const tiltAngle = options.tiltAngle || 0; // 덤프 적재함 기울기
    const isSpinning = options.isSpinning || false; // 레미콘 드럼 회전
    const sirenActive = options.sirenActive !== false; // 사이렌 깜빡임

    const primaryColor = vehicle.color || '#e02424';
    const secondaryColor = vehicle.secondaryColor || '#ffffff';
    const chassisType = vehicle.chassis || 'truck_small';
    const attachmentType = vehicle.attachment || 'none';

    // 섀시별 휠 및 프레임 SVG
    const chassisSVG = this.getChassisSVG(chassisType, primaryColor, secondaryColor);
    // 차체 캐빈 및 몸체 SVG
    const bodySVG = this.getBodySVG(chassisType, primaryColor, secondaryColor, vehicle.category);
    // 상단/전면 부착 모듈 SVG
    const attachmentSVG = this.getAttachmentSVG(attachmentType, {
      armAngle,
      ladderExtension,
      bucketAngle,
      tiltAngle,
      isSpinning,
      primaryColor,
      secondaryColor,
    });
    // 경광등/사이렌 SVG
    const sirenSVG = sirenActive ? this.getSirenSVG(vehicle.category) : '';

    return `
      <svg class="vehicle-svg ${isInteractive ? 'interactive' : ''}" viewBox="0 0 320 200" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="metal-grad-${vehicle.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#94a3b8" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#334155" stop-opacity="0.5"/>
          </linearGradient>
          <filter id="car-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.18"/>
          </filter>
        </defs>

        <!-- 차량 바닥 그림자 -->
        <ellipse cx="160" cy="180" rx="130" ry="12" fill="#0f172a" opacity="0.2"/>

        <g filter="url(#car-shadow)">
          <!-- 1. 차체 몸체 및 캐빈 -->
          ${bodySVG}

          <!-- 2. 부착 기믹 모듈 -->
          ${attachmentSVG}

          <!-- 3. 경광등 / 사이렌 -->
          ${sirenSVG}

          <!-- 4. 하단 섀시 및 휠 -->
          ${chassisSVG}
        </g>
      </svg>
    `;
  }

  // 1. 하단 섀시 / 휠
  static getChassisSVG(chassisType, primary, secondary) {
    if (chassisType === 'caterpillar') {
      // 무한궤도 캐터필러
      return `
        <g class="chassis-caterpillar">
          <!-- 궤도 벨트 -->
          <rect x="50" y="142" width="220" height="34" rx="17" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
          <!-- 궤도 휠 5개 -->
          <circle cx="75" cy="159" r="13" fill="#64748b" stroke="#334155" stroke-width="3"/>
          <circle cx="75" cy="159" r="5" fill="#0f172a"/>
          <circle cx="118" cy="159" r="13" fill="#64748b" stroke="#334155" stroke-width="3"/>
          <circle cx="118" cy="159" r="5" fill="#0f172a"/>
          <circle cx="160" cy="159" r="13" fill="#64748b" stroke="#334155" stroke-width="3"/>
          <circle cx="160" cy="159" r="5" fill="#0f172a"/>
          <circle cx="202" cy="159" r="13" fill="#64748b" stroke="#334155" stroke-width="3"/>
          <circle cx="202" cy="159" r="5" fill="#0f172a"/>
          <circle cx="245" cy="159" r="13" fill="#64748b" stroke="#334155" stroke-width="3"/>
          <circle cx="245" cy="159" r="5" fill="#0f172a"/>
        </g>
      `;
    }

    if (chassisType === 'truck_heavy') {
      // 대형 트럭 (전방 1쌍 + 후방 2쌍 대형 휠 6륜)
      return `
        <g class="chassis-heavy">
          <rect x="40" y="146" width="240" height="10" rx="3" fill="#334155"/>
          <!-- 앞바퀴 -->
          ${this.renderWheel(78, 156, 20)}
          <!-- 뒷바퀴 더블 -->
          ${this.renderWheel(205, 156, 20)}
          ${this.renderWheel(245, 156, 20)}
        </g>
      `;
    }

    if (chassisType === 'car') {
      // 승용차/SUV 휠
      return `
        <g class="chassis-car">
          <rect x="55" y="148" width="200" height="8" rx="3" fill="#334155"/>
          ${this.renderWheel(85, 156, 18)}
          ${this.renderWheel(225, 156, 18)}
        </g>
      `;
    }

    if (chassisType === 'heavy_machinery') {
      // 아스팔트 롤러 등 특수 중장비 (거대 롤러 휠)
      return `
        <g class="chassis-roller">
          <rect x="60" y="130" width="40" height="45" rx="8" fill="#475569" stroke="#1e293b" stroke-width="4"/>
          ${this.renderWheel(230, 154, 22)}
        </g>
      `;
    }

    // 기본 소형 트럭 / 버스
    return `
      <g class="chassis-truck">
        <rect x="45" y="148" width="225" height="9" rx="3" fill="#334155"/>
        ${this.renderWheel(80, 156, 19)}
        ${this.renderWheel(230, 156, 19)}
      </g>
    `;
  }

  // 바퀴 SVG 헬퍼
  static renderWheel(cx, cy, r) {
    return `
      <g class="wheel" transform-origin="${cx} ${cy}">
        <!-- 타이어 고무 -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
        <!-- 휠 림 -->
        <circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="#475569"/>
        <!-- 볼트 디테일 -->
        <circle cx="${cx}" cy="${cy - r * 0.4}" r="1.5" fill="#334155"/>
        <circle cx="${cx}" cy="${cy + r * 0.4}" r="1.5" fill="#334155"/>
        <circle cx="${cx - r * 0.4}" cy="${cy}" r="1.5" fill="#334155"/>
        <circle cx="${cx + r * 0.4}" cy="${cy}" r="1.5" fill="#334155"/>
      </g>
    `;
  }

  // 2. 차체 몸체 및 캐빈
  static getBodySVG(chassisType, primary, secondary, category) {
    if (chassisType === 'car') {
      // 날렵한 승용차 바디
      return `
        <g class="body-car">
          <!-- 메인 바디 -->
          <path d="M 45 146 L 60 115 Q 90 112 110 88 L 195 88 Q 235 110 265 125 L 275 146 Z" fill="${primary}" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
          <!-- 하단 사이드 스커트/데칼 -->
          <path d="M 52 144 L 270 144 L 265 132 L 56 132 Z" fill="${secondary}"/>
          <!-- 앞/뒤 창문 -->
          <path d="M 115 92 L 152 92 L 152 118 L 98 118 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
          <path d="M 158 92 L 195 92 L 225 118 L 158 118 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
          <!-- 헤드라이트 -->
          <polygon points="45,130 52,126 52,138 45,136" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
          <!-- 후미등 -->
          <rect x="270" y="128" width="5" height="12" rx="2" fill="#ef4444"/>
          <!-- 귀여운 눈망울 헤드라이트 효과 -->
          <circle cx="68" cy="130" r="4" fill="#ffffff"/>
        </g>
      `;
    }

    if (chassisType === 'bus') {
      // 듬직하고 귀여운 버스/승합 바디
      return `
        <g class="body-bus">
          <rect x="45" y="80" width="230" height="70" rx="14" fill="${primary}" stroke="#0f172a" stroke-width="3"/>
          <!-- 버스 중앙 띠 -->
          <rect x="45" y="118" width="230" height="14" fill="${secondary}"/>
          <!-- 버스 창문들 (3개 연속) -->
          <rect x="55" y="88" width="45" height="25" rx="5" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
          <rect x="110" y="88" width="45" height="25" rx="5" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
          <rect x="165" y="88" width="45" height="25" rx="5" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
          <rect x="220" y="88" width="45" height="25" rx="5" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
          <!-- 헤드라이트 -->
          <circle cx="53" cy="135" r="7" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
        </g>
      `;
    }

    if (chassisType === 'caterpillar') {
      // 굴착기/불도저용 상부 회전 캐빈
      return `
        <g class="body-excavator-cabin">
          <!-- 턴테이블 베이스 -->
          <rect x="90" y="132" width="140" height="14" rx="4" fill="#334155" stroke="#0f172a" stroke-width="2"/>
          <!-- 메인 조종석 캐빈 -->
          <path d="M 75 132 L 75 90 Q 75 80 88 80 L 140 80 L 140 132 Z" fill="${primary}" stroke="#0f172a" stroke-width="3"/>
          <!-- 대형 유리창 -->
          <path d="M 82 86 L 132 86 L 132 120 L 82 120 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
          <!-- 엔진룸 및 카운터웨이트 후방 -->
          <rect x="140" y="92" width="85" height="40" rx="8" fill="${primary}" stroke="#0f172a" stroke-width="3"/>
          <rect x="155" y="98" width="60" height="10" rx="2" fill="${secondary}"/>
        </g>
      `;
    }

    // 기본 트럭 (대형/소형): 앞쪽 운전석 캐빈 + 뒤쪽 베이스 프레임
    return `
      <g class="body-truck">
        <!-- 앞쪽 운전석 캐빈 -->
        <path d="M 45 148 L 45 105 Q 48 85 70 85 L 115 85 L 115 148 Z" fill="${primary}" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
        <!-- 운전석 앞유리 -->
        <path d="M 52 92 L 108 92 L 108 118 L 52 118 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
        <!-- 앞 범퍼 & 라이트 -->
        <rect x="40" y="132" width="10" height="16" rx="2" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
        <circle cx="48" cy="126" r="6" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
        <!-- 뒤쪽 적재/장비 프레임 데크 -->
        <rect x="115" y="105" width="155" height="43" rx="4" fill="${secondary}" stroke="#0f172a" stroke-width="3"/>
      </g>
    `;
  }

  // 3. 상단/전면 부착 모듈
  static getAttachmentSVG(attachmentType, props) {
    const { armAngle, ladderExtension, bucketAngle, tiltAngle, isSpinning, primaryColor, secondaryColor } = props;

    switch (attachmentType) {
      // 1) 소방 고가사다리
      case 'ladder_aerial':
        return `
          <g class="mod-ladder" transform="translate(130, 105) rotate(${armAngle || -20})">
            <!-- 사다리 턴테이블 받침 -->
            <rect x="-15" y="-10" width="30" height="15" rx="4" fill="#475569" stroke="#1e293b" stroke-width="2"/>
            <!-- 1단 메인 사다리 -->
            <rect x="0" y="-12" width="140" height="20" rx="3" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
            <line x1="25" y1="-12" x2="25" y2="8" stroke="#475569" stroke-width="3"/>
            <line x1="55" y1="-12" x2="55" y2="8" stroke="#475569" stroke-width="3"/>
            <line x1="85" y1="-12" x2="85" y2="8" stroke="#475569" stroke-width="3"/>
            <line x1="115" y1="-12" x2="115" y2="8" stroke="#475569" stroke-width="3"/>
            <!-- 2단 확장 사다리 -->
            <g transform="translate(${ladderExtension || 40}, 0)">
              <rect x="20" y="-8" width="90" height="12" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
              <!-- 끝단 바스켓 -->
              <rect x="105" y="-16" width="22" height="24" rx="3" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
            </g>
          </g>
        `;

      // 2) 굴절사다리차
      case 'ladder_articulated':
        return `
          <g class="mod-articulated-ladder" transform="translate(135, 105) rotate(${armAngle || -15})">
            <!-- 1관절 붐대 -->
            <line x1="0" y1="0" x2="70" y2="-40" stroke="#facc15" stroke-width="12" stroke-linecap="round"/>
            <circle cx="70" cy="-40" r="7" fill="#334155"/>
            <!-- 2관절 붐대 -->
            <g transform="translate(70, -40) rotate(${bucketAngle || 30})">
              <line x1="0" y1="0" x2="65" y2="10" stroke="#facc15" stroke-width="10" stroke-linecap="round"/>
              <rect x="65" y="-5" width="20" height="22" rx="3" fill="#e02424" stroke="#7f1d1d" stroke-width="2"/>
            </g>
          </g>
        `;

      // 3) 고성능 방수포 / 무인방수탑
      case 'water_cannon':
      case 'water_tower':
      case 'foam_cannon':
        return `
          <g class="mod-water-cannon" transform="translate(140, 100) rotate(${armAngle || -10})">
            <circle cx="0" cy="0" r="10" fill="#64748b" stroke="#1e293b" stroke-width="2"/>
            <!-- 방수포 노즐 노즐 -->
            <path d="M 0 -6 L 45 -4 L 45 4 L 0 6 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
            <rect x="42" y="-7" width="10" height="14" rx="2" fill="#38bdf8"/>
          </g>
        `;

      // 4) 굴착기 버킷 암
      case 'bucket_excavator':
        return `
          <g class="mod-excavator-arm" transform="translate(100, 110) rotate(${armAngle || -25})">
            <!-- 1차 붐대 -->
            <line x1="0" y1="0" x2="65" y2="-55" stroke="#eab308" stroke-width="14" stroke-linecap="round"/>
            <circle cx="65" cy="-55" r="8" fill="#1e293b"/>
            <!-- 2차 암 -->
            <g transform="translate(65, -55) rotate(${bucketAngle || 50})">
              <line x1="0" y1="0" x2="50" y2="35" stroke="#eab308" stroke-width="12" stroke-linecap="round"/>
              <circle cx="50" cy="35" r="7" fill="#1e293b"/>
              <!-- 포클레인 버킷 -->
              <path d="M 50 35 Q 75 45 70 70 L 45 65 Z" fill="#475569" stroke="#0f172a" stroke-width="3"/>
              <!-- 버킷 이빨 -->
              <polygon points="70,70 76,73 71,66" fill="#1e293b"/>
            </g>
          </g>
        `;

      // 5) 덤프트럭 베드
      case 'dump_bed':
        return `
          <g class="mod-dump-bed" transform="translate(255, 140) rotate(${tiltAngle || 0}) translate(-255, -140)">
            <path d="M 125 140 L 265 140 L 265 95 L 125 95 Z" fill="#2563eb" stroke="#1e3a8a" stroke-width="3"/>
            <!-- 덤프 흙 디테일 -->
            <ellipse cx="195" cy="94" rx="50" ry="12" fill="#78350f"/>
          </g>
        `;

      // 6) 레미콘 회전 드럼
      case 'mixer_drum':
        return `
          <g class="mod-mixer-drum ${isSpinning ? 'spin-anim' : ''}" transform="translate(195, 120)">
            <!-- 타원형 드럼 -->
            <ellipse cx="0" cy="0" rx="55" ry="32" fill="#10b981" stroke="#047857" stroke-width="3" transform="rotate(-15)"/>
            <!-- 나선형 무늬 -->
            <path d="M -40 -12 Q 0 -5 40 10" stroke="#f1f5f9" stroke-width="6" fill="none"/>
            <path d="M -30 12 Q 10 5 35 -15" stroke="#f1f5f9" stroke-width="6" fill="none"/>
          </g>
        `;

      // 7) 크레인 후크 / 윈치
      case 'crane_hook':
      case 'tank_crane':
      case 'underlift_arm':
        return `
          <g class="mod-crane" transform="translate(140, 105) rotate(${armAngle || -25})">
            <!-- 크레인 붐 -->
            <rect x="0" y="-8" width="115" height="16" rx="3" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
            <!-- 와이어 줄 -->
            <line x1="110" y1="0" x2="110" y2="45" stroke="#334155" stroke-width="2" stroke-dasharray="2,2"/>
            <!-- 갈고리 훅 -->
            <path d="M 106 45 Q 110 55 115 50 Q 120 45 118 40" fill="none" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
          </g>
        `;

      // 8) 불도저 / 제설차 전면 블레이드
      case 'blade_dozer':
      case 'blade_snow':
        return `
          <g class="mod-blade">
            <path d="M 32 125 Q 18 145 25 168 L 38 165 Q 32 145 42 128 Z" fill="#eab308" stroke="#713f12" stroke-width="3"/>
          </g>
        `;

      // 9) 노면청소차 회전 브러시
      case 'sweeper_brush':
        return `
          <g class="mod-brush">
            <ellipse cx="60" cy="165" rx="16" ry="7" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <line x1="50" y1="165" x2="70" y2="165" stroke="#854d0e" stroke-width="2"/>
          </g>
        `;

      // 기본 (장비 없음 또는 일반 탱크)
      default:
        return '';
    }
  }

  // 4. 경광등 / 사이렌 SVG
  static getSirenSVG(category) {
    let lightColor1 = '#ef4444';
    let lightColor2 = '#3b82f6';

    if (category === 'fire') {
      lightColor1 = '#ef4444';
      lightColor2 = '#f59e0b';
    } else if (category === 'medic') {
      lightColor1 = '#22c55e';
      lightColor2 = '#ef4444';
    } else if (category === 'construction') {
      lightColor1 = '#f59e0b';
      lightColor2 = '#f59e0b';
    }

    return `
      <g class="siren-light">
        <rect x="75" y="77" width="18" height="9" rx="3" fill="${lightColor1}" stroke="#991b1b" stroke-width="1.5">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
        </rect>
        <rect x="94" y="77" width="18" height="9" rx="3" fill="${lightColor2}" stroke="#1d4ed8" stroke-width="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite" />
        </rect>
      </g>
    `;
  }
}

window.VehicleRenderer = VehicleRenderer;
