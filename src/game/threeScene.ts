import * as THREE from 'three';
import { CustomerData, PlayerStats } from '../types';

export interface InteractiveTarget {
  id: string;
  type: 'machine' | 'counter' | 'table' | 'register';
  tableIndex?: number;
  position: THREE.Vector3;
  label: string;
  actionText: string;
}

export class CoffeeShopWorld {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  
  // Lighting
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private counterSpot!: THREE.SpotLight;
  private tableLights: THREE.PointLight[] = [];

  // Groups
  private cafeGroup: THREE.Group;
  private tablesGroup: THREE.Group;
  private decorGroup: THREE.Group;
  private playerGroup: THREE.Group;
  private staffGroup: THREE.Group;
  private customerGroups: Map<string, THREE.Group> = new Map();
  private particleGroup: THREE.Group;

  // Player state in 3D
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 1.5);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerRotation: number = 0;
  public isPlayerMoving: boolean = false;
  private playerWalkCycle: number = 0;
  private playerLimbRefs: {
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
    tray?: THREE.Group;
  } = {};

  // Staff state
  private hasStaff: boolean = false;
  private staffWalkCycle: number = 0;

  // Interactive targets
  public interactiveTargets: InteractiveTarget[] = [];
  public currentClosestTarget: InteractiveTarget | null = null;
  private highlightRing!: THREE.Mesh;

  // Steam particles
  private steamParticles: { mesh: THREE.Mesh; velY: number; life: number; maxLife: number }[] = [];
  public isBrewingSteam: boolean = false;

  // Tables
  public tablePositions: { pos: THREE.Vector3; chairPos: THREE.Vector3; group: THREE.Group; level: number }[] = [];

  // Animation frame
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();
  private isDestroyed: boolean = false;

  // Camera settings
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 1.2, 1.5);
  public cameraAngle: number = 0; // optional rotation offset
  public cameraDistance: number = 9.5;

  // Holding item
  public isHoldingDrink: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1c140e');
    this.scene.fog = new THREE.FogExp2('#1c140e', 0.022);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 9, 10);
    this.camera.lookAt(0, 1.2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    this.cafeGroup = new THREE.Group();
    this.tablesGroup = new THREE.Group();
    this.decorGroup = new THREE.Group();
    this.playerGroup = new THREE.Group();
    this.staffGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();

    this.scene.add(this.cafeGroup);
    this.scene.add(this.tablesGroup);
    this.scene.add(this.decorGroup);
    this.scene.add(this.playerGroup);
    this.scene.add(this.staffGroup);
    this.scene.add(this.particleGroup);

    this.setupLighting();
    this.buildCafeEnvironment();
    this.buildPlayer();
    this.buildStaff();
    this.buildHighlightMarker();

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private setupLighting() {
    // Warm cozy ambient light
    this.ambientLight = new THREE.AmbientLight('#ffe0b2', 0.85);
    this.scene.add(this.ambientLight);

    // Warm sunlight through cafe window
    this.sunLight = new THREE.DirectionalLight('#fff3e0', 1.3);
    this.sunLight.position.set(8, 12, 6);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 30;
    this.sunLight.shadow.camera.left = -10;
    this.sunLight.shadow.camera.right = 10;
    this.sunLight.shadow.camera.top = 10;
    this.sunLight.shadow.camera.bottom = -10;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    // Warm spotlight over espresso counter bar
    this.counterSpot = new THREE.SpotLight('#ffd54f', 2.2, 12, Math.PI / 4, 0.4);
    this.counterSpot.position.set(0, 5, -2);
    this.counterSpot.target.position.set(0, 1, -2.5);
    this.counterSpot.castShadow = true;
    this.scene.add(this.counterSpot);
    this.scene.add(this.counterSpot.target);

    // Fill light for soft shadow warmth
    const fillLight = new THREE.DirectionalLight('#ffab91', 0.4);
    fillLight.position.set(-6, 8, -6);
    this.scene.add(fillLight);
  }

  // Generate procedural textures to ensure zero network loading failures
  private createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Warm rich wood planks
    ctx.fillStyle = '#8d5524';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 64;
    for (let y = 0; y < 512; y += plankHeight) {
      // Wood plank base with slight tone variation
      ctx.fillStyle = (y / plankHeight) % 2 === 0 ? '#7a4519' : '#885122';
      ctx.fillRect(0, y, 512, plankHeight - 2);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(50, 25, 5, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const lineY = y + (i * 9);
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.bezierCurveTo(150, lineY + Math.sin(i) * 3, 350, lineY - Math.cos(i) * 3, 512, lineY);
        ctx.stroke();
      }

      // Plank seams
      ctx.fillStyle = '#422208';
      ctx.fillRect(0, y + plankHeight - 2, 512, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  private createCounterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Polished warm white marble counter
    ctx.fillStyle = '#f5f0ea';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(180, 160, 140, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.bezierCurveTo(80, 90, 180, 40, 250, 200);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private buildCafeEnvironment() {
    const woodTexture = this.createWoodTexture();
    const counterMarbleTexture = this.createCounterTexture();

    // 1. Floor
    const floorGeo = new THREE.PlaneGeometry(16, 14);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.55,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.cafeGroup.add(floor);

    // 2. Back Wall (Dark cozy cafe brick/panel with warm tone)
    const backWallGeo = new THREE.BoxGeometry(16, 5, 0.3);
    const backWallMat = new THREE.MeshStandardMaterial({ color: '#32231c', roughness: 0.8 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 2.5, -7);
    backWall.receiveShadow = true;
    this.cafeGroup.add(backWall);

    // Back wall chalkboard menu
    const menuBoardGeo = new THREE.BoxGeometry(7, 2.2, 0.08);
    const menuCanvas = document.createElement('canvas');
    menuCanvas.width = 512;
    menuCanvas.height = 256;
    const mctx = menuCanvas.getContext('2d')!;
    mctx.fillStyle = '#1e2421';
    mctx.fillRect(0, 0, 512, 256);
    mctx.fillStyle = '#f5f5f5';
    mctx.font = 'bold 28px sans-serif';
    mctx.fillText('☕ COFFEE SHOP STORY', 90, 48);
    mctx.strokeStyle = '#d4af37';
    mctx.lineWidth = 3;
    mctx.strokeRect(10, 10, 492, 236);
    mctx.font = '20px sans-serif';
    mctx.fillStyle = '#e0d8c8';
    mctx.fillText('• Espresso ....... $4.00', 40, 95);
    mctx.fillText('• Americano ..... $5.00', 40, 135);
    mctx.fillText('• Cappuccino ... $6.00', 40, 175);
    mctx.fillText('• Caffe Latte ... $6.50', 40, 215);
    mctx.fillText('• Iced Coffee ... $7.00', 270, 95);
    mctx.fillText('• Herbal Tea .... $4.50', 270, 135);
    mctx.fillText('• Chocolate ..... $5.50', 270, 175);
    mctx.fillStyle = '#ffd54f';
    mctx.fillText('Freshly Roasted Everyday!', 260, 220);

    const menuTex = new THREE.CanvasTexture(menuCanvas);
    const menuBoardMat = new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.6 });
    const menuBoard = new THREE.Mesh(menuBoardGeo, menuBoardMat);
    menuBoard.position.set(0, 3.2, -6.82);
    this.cafeGroup.add(menuBoard);

    // Wooden wall shelves with jars and cups
    const shelfGeo = new THREE.BoxGeometry(6.5, 0.1, 0.5);
    const shelfMat = new THREE.MeshStandardMaterial({ color: '#5d3a1a', roughness: 0.6 });
    const shelf1 = new THREE.Mesh(shelfGeo, shelfMat);
    shelf1.position.set(0, 1.8, -6.7);
    this.cafeGroup.add(shelf1);

    // Decorative coffee bean jars on shelf
    for (let i = -3; i <= 3; i++) {
      const jarGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12);
      const jarMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? '#4e342e' : '#8d6e63',
        roughness: 0.3,
        metalness: 0.1
      });
      const jar = new THREE.Mesh(jarGeo, jarMat);
      jar.position.set(i * 0.8, 2.02, -6.7);
      this.cafeGroup.add(jar);
    }

    // 3. Left Wall with warm cafe windows
    const leftWallGeo = new THREE.BoxGeometry(0.3, 5, 14);
    const leftWallMat = new THREE.MeshStandardMaterial({ color: '#443026', roughness: 0.85 });
    const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
    leftWall.position.set(-8, 2.5, 0);
    this.cafeGroup.add(leftWall);

    // Cafe Window frame
    const windowFrameGeo = new THREE.BoxGeometry(0.4, 2.8, 5.5);
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: '#2a1a12' });
    const windowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    windowFrame.position.set(-7.9, 2.6, 1);
    this.cafeGroup.add(windowFrame);

    // Warm outdoor view through window
    const windowPaneGeo = new THREE.PlaneGeometry(5.2, 2.5);
    const windowPaneMat = new THREE.MeshBasicMaterial({ color: '#ffe0b2' });
    const windowPane = new THREE.Mesh(windowPaneGeo, windowPaneMat);
    windowPane.rotation.y = Math.PI / 2;
    windowPane.position.set(-7.7, 2.6, 1);
    this.cafeGroup.add(windowPane);

    // 4. Right Wall with Entrance Door
    const rightWallGeo = new THREE.BoxGeometry(0.3, 5, 14);
    const rightWall = new THREE.Mesh(rightWallGeo, leftWallMat);
    rightWall.position.set(8, 2.5, 0);
    this.cafeGroup.add(rightWall);

    // Entrance Door frame at right-front
    const doorFrameGeo = new THREE.BoxGeometry(0.4, 3.4, 2.2);
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: '#3e2723' });
    const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorFrame.position.set(7.9, 1.7, 4.5);
    this.cafeGroup.add(doorFrame);

    // Glass door panel
    const doorPaneGeo = new THREE.PlaneGeometry(1.8, 3.0);
    const doorPaneMat = new THREE.MeshStandardMaterial({
      color: '#d7ccc8',
      transparent: true,
      opacity: 0.55,
      roughness: 0.1
    });
    const doorPane = new THREE.Mesh(doorPaneGeo, doorPaneMat);
    doorPane.rotation.y = -Math.PI / 2;
    doorPane.position.set(7.7, 1.7, 4.5);
    this.cafeGroup.add(doorPane);

    // Hanging Brass Door Bell above door
    const bellGeo = new THREE.ConeGeometry(0.12, 0.16, 12);
    const bellMat = new THREE.MeshStandardMaterial({ color: '#ffd54f', metalness: 0.8, roughness: 0.2 });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.set(7.5, 3.3, 4.5);
    this.cafeGroup.add(bell);

    // Welcome Doormat
    const matGeo = new THREE.BoxGeometry(1.5, 0.04, 2.2);
    const matMat = new THREE.MeshStandardMaterial({ color: '#6d4c41', roughness: 0.9 });
    const doormat = new THREE.Mesh(matGeo, matMat);
    doormat.position.set(7.1, 0.02, 4.5);
    this.cafeGroup.add(doormat);

    // 5. Main Coffee Bar Counter
    this.buildCoffeeBarCounter(counterMarbleTexture);

    // 6. Default Seating Tables
    this.buildDefaultTables();

    // 7. Hanging Pendant Lamps
    this.buildHangingLamps();
  }

  private buildCoffeeBarCounter(marbleTex: THREE.CanvasTexture) {
    const counterGroup = new THREE.Group();

    // Wooden base of the counter
    const counterBaseGeo = new THREE.BoxGeometry(8.2, 1.1, 1.8);
    const counterBaseMat = new THREE.MeshStandardMaterial({ color: '#4a2c16', roughness: 0.7 });
    const counterBase = new THREE.Mesh(counterBaseGeo, counterBaseMat);
    counterBase.position.set(0, 0.55, -3.2);
    counterBase.castShadow = true;
    counterBase.receiveShadow = true;
    counterGroup.add(counterBase);

    // Counter marble countertop
    const counterTopGeo = new THREE.BoxGeometry(8.6, 0.14, 2.1);
    const counterTopMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      roughness: 0.35,
      metalness: 0.05
    });
    const counterTop = new THREE.Mesh(counterTopGeo, counterTopMat);
    counterTop.position.set(0, 1.17, -3.2);
    counterTop.castShadow = true;
    counterTop.receiveShadow = true;
    counterGroup.add(counterTop);

    // Decorative vertical wood slats on front of counter
    for (let x = -3.8; x <= 3.8; x += 0.35) {
      const slatGeo = new THREE.BoxGeometry(0.12, 1.0, 0.05);
      const slatMat = new THREE.MeshStandardMaterial({ color: '#331d0e', roughness: 0.8 });
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(x, 0.55, -2.27);
      counterGroup.add(slat);
    }

    // --- High-Detail Espresso Machine ---
    this.buildEspressoMachine(counterGroup);

    // --- Cash Register ---
    const registerBaseGeo = new THREE.BoxGeometry(0.7, 0.25, 0.6);
    const registerMat = new THREE.MeshStandardMaterial({ color: '#263238', metalness: 0.5, roughness: 0.4 });
    const registerBase = new THREE.Mesh(registerBaseGeo, registerMat);
    registerBase.position.set(2.4, 1.34, -3.1);
    registerBase.castShadow = true;
    counterGroup.add(registerBase);

    // Register screen / touch display
    const screenGeo = new THREE.BoxGeometry(0.55, 0.4, 0.08);
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 128;
    screenCanvas.height = 128;
    const sctx = screenCanvas.getContext('2d')!;
    sctx.fillStyle = '#004d40';
    sctx.fillRect(0, 0, 128, 128);
    sctx.fillStyle = '#a7ffeb';
    sctx.font = 'bold 20px sans-serif';
    sctx.fillText('$ READY', 16, 45);
    sctx.font = '14px sans-serif';
    sctx.fillText('Coffee Story', 16, 85);
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screenMat = new THREE.MeshStandardMaterial({ map: screenTex, roughness: 0.3 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(2.4, 1.6, -3.0);
    screen.rotation.x = -Math.PI / 10;
    counterGroup.add(screen);

    // Tip jar with green dollar bill inside
    const jarGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.35, 12);
    const jarMat = new THREE.MeshStandardMaterial({
      color: '#e0f7fa',
      transparent: true,
      opacity: 0.6,
      roughness: 0.1
    });
    const tipJar = new THREE.Mesh(jarGeo, jarMat);
    tipJar.position.set(3.2, 1.42, -3.1);
    counterGroup.add(tipJar);

    // Stacks of coffee cups on counter
    for (let c = 0; c < 3; c++) {
      const cupStackGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.45, 12);
      const cupMat = new THREE.MeshStandardMaterial({ color: '#fff9c4', roughness: 0.4 });
      const cupStack = new THREE.Mesh(cupStackGeo, cupMat);
      cupStack.position.set(-2.6 - c * 0.32, 1.47, -3.1);
      counterGroup.add(cupStack);
    }

    // Pastry display dome
    const domeGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.45,
      roughness: 0.1
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(1.1, 1.25, -3.1);
    counterGroup.add(dome);

    // Croissant inside dome
    const croissantGeo = new THREE.TorusGeometry(0.16, 0.08, 8, 12, Math.PI);
    const croissantMat = new THREE.MeshStandardMaterial({ color: '#d7a15c', roughness: 0.6 });
    const croissant = new THREE.Mesh(croissantGeo, croissantMat);
    croissant.rotation.x = Math.PI / 2;
    croissant.position.set(1.1, 1.3, -3.1);
    counterGroup.add(croissant);

    this.cafeGroup.add(counterGroup);

    // Register interactive targets
    this.interactiveTargets.push({
      id: 'machine',
      type: 'machine',
      position: new THREE.Vector3(-0.9, 0, -2.1),
      label: 'Espresso Machine',
      actionText: 'Make Coffee'
    });

    this.interactiveTargets.push({
      id: 'counter',
      type: 'counter',
      position: new THREE.Vector3(1.6, 0, -2.1),
      label: 'Order Counter',
      actionText: 'Take Order / Serve'
    });
  }

  private buildEspressoMachine(parent: THREE.Group) {
    const machineGroup = new THREE.Group();
    machineGroup.position.set(-0.9, 1.24, -3.2);

    // Main machine body (gleaming red & chrome cafe commercial machine)
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.95, 0.95);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#c62828', // Classic Italian red
      metalness: 0.6,
      roughness: 0.25
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.48, 0);
    body.castShadow = true;
    machineGroup.add(body);

    // Chrome top warming tray
    const trayGeo = new THREE.BoxGeometry(1.5, 0.06, 0.85);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#eceff1',
      metalness: 0.9,
      roughness: 0.15
    });
    const tray = new THREE.Mesh(trayGeo, chromeMat);
    tray.position.set(0, 0.98, 0);
    machineGroup.add(tray);

    // Miniature espresso cups warming on top
    for (let i = -2; i <= 2; i++) {
      const demitasseGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.08, 10);
      const demitasseMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });
      const demitasse = new THREE.Mesh(demitasseGeo, demitasseMat);
      demitasse.position.set(i * 0.24, 1.05, (i % 2 === 0 ? 0.1 : -0.1));
      machineGroup.add(demitasse);
    }

    // Dual Groupheads with chrome portafilters
    for (const gx of [-0.35, 0.35]) {
      const groupheadGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 12);
      const grouphead = new THREE.Mesh(groupheadGeo, chromeMat);
      grouphead.position.set(gx, 0.3, 0.5);
      machineGroup.add(grouphead);

      // Portafilter handle
      const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.32, 8);
      const handleMat = new THREE.MeshStandardMaterial({ color: '#212121', roughness: 0.5 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(gx, 0.25, 0.72);
      machineGroup.add(handle);
    }

    // Chrome Drip Tray
    const dripTrayGeo = new THREE.BoxGeometry(1.45, 0.08, 0.45);
    const dripTray = new THREE.Mesh(dripTrayGeo, chromeMat);
    dripTray.position.set(0, 0.04, 0.58);
    machineGroup.add(dripTray);

    // Pressure Gauges on front panel
    for (const px of [-0.65, 0.65]) {
      const gaugeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 14);
      const gaugeMat = new THREE.MeshStandardMaterial({ color: '#fff9c4', metalness: 0.8, roughness: 0.2 });
      const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(px, 0.65, 0.49);
      machineGroup.add(gauge);
    }

    // Steam wand
    const wandGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
    const wand = new THREE.Mesh(wandGeo, chromeMat);
    wand.rotation.z = Math.PI / 6;
    wand.position.set(0.68, 0.3, 0.55);
    machineGroup.add(wand);

    parent.add(machineGroup);
  }

  private buildDefaultTables() {
    // 5 Table slots across the cafe floor
    const tableConfigs = [
      { pos: new THREE.Vector3(-4.5, 0, 1.2), chairPos: new THREE.Vector3(-4.5, 0, 2.2), level: 1 },
      { pos: new THREE.Vector3(-1.2, 0, 3.2), chairPos: new THREE.Vector3(-1.2, 0, 4.2), level: 1 },
      { pos: new THREE.Vector3(3.6, 0, 1.2), chairPos: new THREE.Vector3(3.6, 0, 2.2), level: 2 },
      { pos: new THREE.Vector3(-4.5, 0, 4.5), chairPos: new THREE.Vector3(-4.5, 0, 5.5), level: 3 },
      { pos: new THREE.Vector3(3.2, 0, 4.5), chairPos: new THREE.Vector3(3.2, 0, 5.5), level: 4 }
    ];

    tableConfigs.forEach((cfg, idx) => {
      const tableGroup = new THREE.Group();
      tableGroup.position.copy(cfg.pos);

      // Table top (smooth dark walnut)
      const topGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24);
      const topMat = new THREE.MeshStandardMaterial({ color: '#5d3a1a', roughness: 0.5 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.9;
      top.castShadow = true;
      top.receiveShadow = true;
      tableGroup.add(top);

      // Table leg (cast iron)
      const legGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 12);
      const ironMat = new THREE.MeshStandardMaterial({ color: '#212121', metalness: 0.8, roughness: 0.4 });
      const leg = new THREE.Mesh(legGeo, ironMat);
      leg.position.y = 0.45;
      leg.castShadow = true;
      tableGroup.add(leg);

      // Table base
      const baseGeo = new THREE.CylinderGeometry(0.4, 0.42, 0.04, 16);
      const base = new THREE.Mesh(baseGeo, ironMat);
      base.position.y = 0.02;
      tableGroup.add(base);

      // Small flower vase on table
      const vaseGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.22, 10);
      const vaseMat = new THREE.MeshStandardMaterial({ color: '#e0f2f1', roughness: 0.2 });
      const vase = new THREE.Mesh(vaseGeo, vaseMat);
      vase.position.y = 1.05;
      tableGroup.add(vase);

      // Flower petal
      const flowerGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const flowerMat = new THREE.MeshStandardMaterial({ color: '#f06292' });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.y = 1.2;
      tableGroup.add(flower);

      // Chairs around table
      for (const angle of [0, Math.PI]) {
        const chairDist = 1.05;
        const chairGroup = new THREE.Group();
        chairGroup.position.set(Math.sin(angle) * chairDist, 0, Math.cos(angle) * chairDist);
        chairGroup.rotation.y = angle + Math.PI;

        // Seat cushion
        const seatGeo = new THREE.BoxGeometry(0.55, 0.08, 0.55);
        const cushionMat = new THREE.MeshStandardMaterial({ color: '#a1887f', roughness: 0.7 });
        const seat = new THREE.Mesh(seatGeo, cushionMat);
        seat.position.y = 0.5;
        seat.castShadow = true;
        chairGroup.add(seat);

        // Chair legs
        for (const [lx, lz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
          const cLegGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.5, 8);
          const cLeg = new THREE.Mesh(cLegGeo, ironMat);
          cLeg.position.set(lx, 0.25, lz);
          chairGroup.add(cLeg);
        }

        // Chair backrest
        const backGeo = new THREE.BoxGeometry(0.55, 0.45, 0.06);
        const back = new THREE.Mesh(backGeo, cushionMat);
        back.position.set(0, 0.8, -0.25);
        chairGroup.add(back);

        tableGroup.add(chairGroup);
      }

      this.tablesGroup.add(tableGroup);

      this.tablePositions.push({
        pos: cfg.pos,
        chairPos: new THREE.Vector3(cfg.pos.x, 0, cfg.pos.z + 1.0),
        group: tableGroup,
        level: cfg.level
      });

      // Register interactive target for this table
      this.interactiveTargets.push({
        id: `table_${idx}`,
        type: 'table',
        tableIndex: idx,
        position: new THREE.Vector3(cfg.pos.x, 0, cfg.pos.z + 0.9),
        label: `Table ${idx + 1}`,
        actionText: 'Serve Table'
      });
    });
  }

  private buildHangingLamps() {
    // Warm Edison wire pendant lamps over tables
    const lampPositions = [
      new THREE.Vector3(-4.5, 4.2, 1.2),
      new THREE.Vector3(-1.2, 4.2, 3.2),
      new THREE.Vector3(3.6, 4.2, 1.2),
      new THREE.Vector3(0, 4.2, -2.8),
    ];

    lampPositions.forEach((pos) => {
      // Wire from ceiling
      const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6);
      const wireMat = new THREE.MeshStandardMaterial({ color: '#212121' });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(pos.x, pos.y - 0.6, pos.z);
      this.cafeGroup.add(wire);

      // Metal socket
      const socketGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 10);
      const socketMat = new THREE.MeshStandardMaterial({ color: '#bcaaa4', metalness: 0.8 });
      const socket = new THREE.Mesh(socketGeo, socketMat);
      socket.position.set(pos.x, pos.y - 1.25, pos.z);
      this.cafeGroup.add(socket);

      // Glowing warm bulb
      const bulbGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffe082' });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(pos.x, pos.y - 1.35, pos.z);
      this.cafeGroup.add(bulb);

      // Warm pointlight
      const light = new THREE.PointLight('#ffecb3', 0.9, 5.5, 1.5);
      light.position.set(pos.x, pos.y - 1.4, pos.z);
      this.cafeGroup.add(light);
      this.tableLights.push(light);
    });
  }

  public updateUpgradesVisuals(stats: PlayerStats) {
    // 1. Table visibility based on tables upgrade level
    this.tablePositions.forEach((t, idx) => {
      const isVisible = idx < stats.tableCount;
      t.group.visible = isVisible;
    });

    // 2. Decor Visuals (Plants, Rug, Neon Sign)
    this.decorGroup.clear();

    if (stats.decorLevel >= 1) {
      // Potted Monstera in corners
      this.buildPottedPlant(new THREE.Vector3(-7.0, 0, -6.0));
      this.buildPottedPlant(new THREE.Vector3(7.0, 0, -2.0));
    }

    if (stats.decorLevel >= 2) {
      // Vintage Bohemian Cafe Rug under seating
      const rugGeo = new THREE.PlaneGeometry(7.5, 6.0);
      const rugCanvas = document.createElement('canvas');
      rugCanvas.width = 256;
      rugCanvas.height = 256;
      const rctx = rugCanvas.getContext('2d')!;
      rctx.fillStyle = '#8b2635';
      rctx.fillRect(0, 0, 256, 256);
      rctx.strokeStyle = '#d4af37';
      rctx.lineWidth = 6;
      rctx.strokeRect(10, 10, 236, 236);
      rctx.strokeRect(25, 25, 206, 206);
      rctx.fillStyle = '#fdf0d5';
      rctx.beginPath();
      rctx.arc(128, 128, 48, 0, Math.PI * 2);
      rctx.fill();
      const rugTex = new THREE.CanvasTexture(rugCanvas);
      const rugMat = new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.9 });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(-1.5, 0.015, 3.2);
      this.decorGroup.add(rug);
    }

    if (stats.decorLevel >= 3) {
      // Neon "COFFEE STORY" Art Sign on back wall
      const neonGroup = new THREE.Group();
      neonGroup.position.set(0, 4.6, -6.8);
      const neonLight = new THREE.PointLight('#ff80ab', 2.0, 8);
      neonLight.position.set(0, 0, 0.5);
      neonGroup.add(neonLight);
      this.decorGroup.add(neonGroup);
    }

    // 3. Staff Barista Assistant
    this.hasStaff = stats.staffLevel >= 1;
    this.staffGroup.visible = this.hasStaff;
  }

  private buildPottedPlant(pos: THREE.Vector3) {
    const plantGroup = new THREE.Group();
    plantGroup.position.copy(pos);

    // Ceramic White Pot
    const potGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.7, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.3 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.35;
    pot.castShadow = true;
    plantGroup.add(pot);

    // Soil
    const soilGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.08, 16);
    const soilMat = new THREE.MeshStandardMaterial({ color: '#3e2723', roughness: 0.9 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.68;
    plantGroup.add(soil);

    // Monstera Plant Leaves
    const leafMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.4, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: '#1b5e20' });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(Math.sin(angle) * 0.15, 0.85, Math.cos(angle) * 0.15);
      stem.rotation.z = Math.sin(angle) * 0.45;
      stem.rotation.x = Math.cos(angle) * 0.45;
      plantGroup.add(stem);

      const leafGeo = new THREE.SphereGeometry(0.28, 8, 8);
      leafGeo.scale(1.2, 0.1, 1.8);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.sin(angle) * 0.45, 1.25, Math.cos(angle) * 0.45);
      leaf.rotation.y = angle;
      plantGroup.add(leaf);
    }

    this.decorGroup.add(plantGroup);
  }

  // --- Stylized Player Character (Barista) ---
  private buildPlayer() {
    this.playerGroup.position.copy(this.playerPos);

    // Shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.35, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.playerGroup.add(shadow);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.65, 8);
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#2c3e50', roughness: 0.8 });

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.16, 0.32, 0);
    this.playerGroup.add(leftLeg);
    this.playerLimbRefs.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.16, 0.32, 0);
    this.playerGroup.add(rightLeg);
    this.playerLimbRefs.rightLeg = rightLeg;

    // Torso (White shirt + Green barista apron)
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
    const apronMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.6 }); // Classic coffee apron
    const torso = new THREE.Mesh(torsoGeo, apronMat);
    torso.position.y = 0.88;
    torso.castShadow = true;
    this.playerGroup.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: '#ffcc80', roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.42;
    head.castShadow = true;
    this.playerGroup.add(head);

    // Barista Cap
    const capGeo = new THREE.CylinderGeometry(0.25, 0.27, 0.14, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: '#3e2723', roughness: 0.7 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.6, -0.02);
    this.playerGroup.add(cap);

    // Visor of cap
    const visorGeo = new THREE.BoxGeometry(0.3, 0.04, 0.2);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 1.55, 0.22);
    this.playerGroup.add(visor);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8);
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 });

    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.35, 0.9, 0);
    this.playerGroup.add(leftArm);
    this.playerLimbRefs.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0.35, 0.9, 0);
    this.playerGroup.add(rightArm);
    this.playerLimbRefs.rightArm = rightArm;

    // Holding Tray & Drink cup
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0, 0.85, 0.42);

    const trayMat = new THREE.MeshStandardMaterial({ color: '#5d4037', roughness: 0.5 });
    const trayMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16), trayMat);
    trayGroup.add(trayMesh);

    // Coffee cup on tray
    const cupMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.08, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: '#fff9c4' })
    );
    cupMesh.position.y = 0.12;
    trayGroup.add(cupMesh);

    trayGroup.visible = false;
    this.playerGroup.add(trayGroup);
    this.playerLimbRefs.tray = trayGroup;
  }

  // --- Staff Barista Assistant (Behind Counter) ---
  private buildStaff() {
    this.staffGroup.position.set(-0.1, 0, -4.2);

    const pantsMat = new THREE.MeshStandardMaterial({ color: '#37474f' });
    const apronMat = new THREE.MeshStandardMaterial({ color: '#ef6c00' });
    const skinMat = new THREE.MeshStandardMaterial({ color: '#ffb74d' });

    // Legs
    const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8), pantsMat);
    lLeg.position.set(-0.15, 0.32, 0);
    this.staffGroup.add(lLeg);
    const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8), pantsMat);
    rLeg.position.set(0.15, 0.32, 0);
    this.staffGroup.add(rLeg);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.32), apronMat);
    torso.position.y = 0.88;
    this.staffGroup.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), skinMat);
    head.position.y = 1.38;
    this.staffGroup.add(head);

    // Staff hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), new THREE.MeshStandardMaterial({ color: '#3e2723' }));
    hair.position.set(0, 1.48, -0.04);
    this.staffGroup.add(hair);

    this.staffGroup.visible = false;
  }

  // --- Dynamic Customer 3D Model Creation & Updates ---
  public updateCustomers(customers: CustomerData[]) {
    const activeIds = new Set(customers.map(c => c.id));

    // Remove customers that left
    for (const [id, group] of this.customerGroups.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.customerGroups.delete(id);
      }
    }

    // Create or update customer models
    customers.forEach((c) => {
      let group = this.customerGroups.get(c.id);
      if (!group) {
        group = this.buildCustomerMesh(c);
        this.customerGroups.set(c.id, group);
        this.scene.add(group);
      }

      // Smooth position interpolation
      const current = group.position;
      const target = new THREE.Vector3(...c.currentPos);
      current.lerp(target, 0.2);

      group.rotation.y = c.rotation;

      // Animate walking / drinking
      const isWalking = c.state === 'entering' || c.state === 'walking_to_spot' || c.state === 'leaving';
      const legs = group.userData.legs as { left: THREE.Mesh; right: THREE.Mesh };
      const arms = group.userData.arms as { left: THREE.Mesh; right: THREE.Mesh; cup?: THREE.Mesh };

      if (isWalking && legs) {
        const walkCycle = performance.now() * 0.008;
        legs.left.rotation.x = Math.sin(walkCycle) * 0.6;
        legs.right.rotation.x = -Math.sin(walkCycle) * 0.6;
        if (arms) {
          arms.left.rotation.x = -Math.sin(walkCycle) * 0.4;
          arms.right.rotation.x = Math.sin(walkCycle) * 0.4;
        }
      } else if (c.state === 'drinking') {
        // Customer holds cup to mouth and gently nods
        if (legs) {
          legs.left.rotation.x = Math.PI / 2.2; // sitting
          legs.right.rotation.x = Math.PI / 2.2;
        }
        if (arms && arms.cup) {
          arms.cup.visible = true;
          arms.right.rotation.x = -Math.PI / 2.4;
        }
        group.position.y = 0.15; // seated height adjustment
      } else if (c.tableIndex >= 0) {
        // Seated at table waiting for drink
        if (legs) {
          legs.left.rotation.x = Math.PI / 2.2;
          legs.right.rotation.x = Math.PI / 2.2;
        }
        group.position.y = 0.15;
      } else {
        // Standing at counter
        if (legs) {
          legs.left.rotation.x = 0;
          legs.right.rotation.x = 0;
        }
        group.position.y = 0;
      }
    });
  }

  private buildCustomerMesh(c: CustomerData): THREE.Group {
    const group = new THREE.Group();
    group.position.set(...c.currentPos);

    const skinMat = new THREE.MeshStandardMaterial({ color: '#ffcc80', roughness: 0.6 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: c.clothesColor, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: c.hairColor, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#37474f', roughness: 0.8 });

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(0.32, 14);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    // Legs
    const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8), pantsMat);
    lLeg.position.set(-0.14, 0.3, 0);
    group.add(lLeg);

    const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8), pantsMat);
    rLeg.position.set(0.14, 0.3, 0);
    group.add(rLeg);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.32), clothesMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), skinMat);
    head.position.y = 1.35;
    head.castShadow = true;
    group.add(head);

    // Hair styling based on customer type
    if (c.type === 'student') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), hairMat);
      cap.position.set(0, 1.45, -0.02);
      group.add(cap);
      // Backpack
      const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.22), new THREE.MeshStandardMaterial({ color: '#f57c00' }));
      backpack.position.set(0, 0.85, -0.22);
      group.add(backpack);
    } else if (c.type === 'vip') {
      // Glamorous hat and stylish scarf
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 16), hairMat);
      hat.position.set(0, 1.55, 0);
      group.add(hat);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 16), hairMat);
      crown.position.set(0, 1.68, 0);
      group.add(crown);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 14), hairMat);
      hair.position.set(0, 1.42, -0.04);
      group.add(hair);
    }

    // Arms
    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), clothesMat);
    lArm.position.set(-0.32, 0.85, 0);
    group.add(lArm);

    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), clothesMat);
    rArm.position.set(0.32, 0.85, 0);
    group.add(rArm);

    // Handheld coffee cup (shown when drinking)
    const drinkCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: '#fff9c4' })
    );
    drinkCup.position.set(0, -0.25, 0.12);
    drinkCup.visible = false;
    rArm.add(drinkCup);

    group.userData = {
      legs: { left: lLeg, right: rLeg },
      arms: { left: lArm, right: rArm, cup: drinkCup }
    };

    return group;
  }

  // --- Interactive Highlight Ring ---
  private buildHighlightMarker() {
    const ringGeo = new THREE.RingGeometry(0.8, 0.95, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#ffd54f',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.highlightRing = new THREE.Mesh(ringGeo, ringMat);
    this.highlightRing.rotation.x = -Math.PI / 2;
    this.highlightRing.position.y = 0.03;
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);
  }

  // --- Steam Particles from Espresso Machine ---
  public triggerBrewSteam() {
    this.isBrewingSteam = true;
  }

  public stopBrewSteam() {
    this.isBrewingSteam = false;
  }

  private updateParticles(dt: number) {
    // Generate new steam particle if brewing
    if (this.isBrewingSteam && Math.random() < 0.45) {
      const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.55
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-0.9 + (Math.random() - 0.5) * 0.4, 2.2, -3.0 + (Math.random() - 0.5) * 0.2);
      this.particleGroup.add(mesh);

      this.steamParticles.push({
        mesh,
        velY: 0.8 + Math.random() * 0.5,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4
      });
    }

    // Update existing steam particles
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.life += dt;
      p.mesh.position.y += p.velY * dt;
      p.mesh.scale.multiplyScalar(1.03);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - (p.life / p.maxLife)) * 0.5;

      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.steamParticles.splice(i, 1);
      }
    }
  }

  // --- Player Controls & Animation ---
  public movePlayer(inputX: number, inputZ: number, isRunning: boolean, dt: number) {
    const speed = isRunning ? 5.2 : 3.4;
    const moveX = inputX * speed * dt;
    const moveZ = inputZ * speed * dt;

    if (Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01) {
      this.isPlayerMoving = true;
      this.playerPos.x += moveX;
      this.playerPos.z += moveZ;

      // Cafe bounding box collision bounds
      // Counter bounds: x: [-4.2, 4.2], z: [-4.2, -2.2]
      if (this.playerPos.z < -2.1 && Math.abs(this.playerPos.x) < 4.2) {
        // allow standing behind counter if x is outside or clamp to service edge
        this.playerPos.z = -2.1;
      }

      this.playerPos.x = Math.max(-7.0, Math.min(7.0, this.playerPos.x));
      this.playerPos.z = Math.max(-5.5, Math.min(5.5, this.playerPos.z));

      // Calculate facing rotation
      const targetAngle = Math.atan2(inputX, inputZ);
      this.playerRotation = targetAngle;
      this.playerGroup.rotation.y = targetAngle;

      // Leg and arm swing animation
      this.playerWalkCycle += dt * (isRunning ? 14 : 9);
      if (this.playerLimbRefs.leftLeg && this.playerLimbRefs.rightLeg) {
        this.playerLimbRefs.leftLeg.rotation.x = Math.sin(this.playerWalkCycle) * 0.65;
        this.playerLimbRefs.rightLeg.rotation.x = -Math.sin(this.playerWalkCycle) * 0.65;
      }
      if (this.playerLimbRefs.leftArm && this.playerLimbRefs.rightArm && !this.isHoldingDrink) {
        this.playerLimbRefs.leftArm.rotation.x = -Math.sin(this.playerWalkCycle) * 0.5;
        this.playerLimbRefs.rightArm.rotation.x = Math.sin(this.playerWalkCycle) * 0.5;
      }
    } else {
      this.isPlayerMoving = false;
      if (this.playerLimbRefs.leftLeg && this.playerLimbRefs.rightLeg) {
        this.playerLimbRefs.leftLeg.rotation.x = 0;
        this.playerLimbRefs.rightLeg.rotation.x = 0;
      }
      if (this.playerLimbRefs.leftArm && this.playerLimbRefs.rightArm && !this.isHoldingDrink) {
        this.playerLimbRefs.leftArm.rotation.x = 0;
        this.playerLimbRefs.rightArm.rotation.x = 0;
      }
    }

    this.playerGroup.position.copy(this.playerPos);

    // Holding tray visibility
    if (this.playerLimbRefs.tray) {
      this.playerLimbRefs.tray.visible = this.isHoldingDrink;
    }
    if (this.isHoldingDrink && this.playerLimbRefs.leftArm && this.playerLimbRefs.rightArm) {
      this.playerLimbRefs.leftArm.rotation.x = -Math.PI / 3;
      this.playerLimbRefs.rightArm.rotation.x = -Math.PI / 3;
    }
  }

  // --- Interaction Range Detection ---
  private updateClosestTarget() {
    let closest: InteractiveTarget | null = null;
    let minDist = 2.4; // Max interaction reach

    for (const target of this.interactiveTargets) {
      const dist = this.playerPos.distanceTo(target.position);
      if (dist < minDist) {
        minDist = dist;
        closest = target;
      }
    }

    this.currentClosestTarget = closest;

    if (closest) {
      this.highlightRing.visible = true;
      this.highlightRing.position.set(closest.position.x, 0.03, closest.position.z);
      // Gentle pulsing opacity
      (this.highlightRing.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(performance.now() * 0.006) * 0.25;
    } else {
      this.highlightRing.visible = false;
    }
  }

  // --- Animation & Render Loop ---
  private animate() {
    if (this.isDestroyed) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.updateClosestTarget();
    this.updateParticles(dt);

    // Animate staff barista when hired
    if (this.hasStaff) {
      this.staffWalkCycle += dt * 3;
      this.staffGroup.position.x = -0.3 + Math.sin(this.staffWalkCycle * 0.3) * 0.8;
    }

    // Smooth Third-Person Camera Follow
    const camOffset = new THREE.Vector3(
      Math.sin(this.cameraAngle) * this.cameraDistance * 0.6,
      7.2,
      Math.cos(this.cameraAngle) * this.cameraDistance * 0.85
    );

    const desiredCamPos = this.playerPos.clone().add(camOffset);
    // Smooth camera damping
    this.camera.position.lerp(desiredCamPos, 0.08);

    // Smooth camera target
    const targetPoint = this.playerPos.clone().add(new THREE.Vector3(0, 1.2, -0.4));
    this.cameraTarget.lerp(targetPoint, 0.09);
    this.camera.lookAt(this.cameraTarget);

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private handleResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
