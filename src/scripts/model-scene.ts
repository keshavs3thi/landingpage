// The three.js side of ModelViewer.astro: loads a .glb, slowly orbits it, lets the visitor drag/zoom,
// and toggles an exploded view where every part slides straight out from the assembly's center.
// Renders on demand: the loop stops whenever nothing is moving.

import {
  Box3,
  CanvasTexture,
  DirectionalLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Sphere,
  Spherical,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const EXPLODE_MS = 900; // full assemble <-> explode
const RESET_MS = 700;
const RESUME_MS = 3000; // auto-rotate comes back this long after the visitor lets go
const ROTATE_SPEED = 2.5; // three's units: 1 = one turn a minute
const HOME = { phi: MathUtils.degToRad(62), theta: MathUtils.degToRad(35) }; // three-quarter view from above
const KEY_STEP = MathUtils.degToRad(15);

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

export async function mount(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const canvas = $<HTMLCanvasElement>('canvas');
  const status = $('[data-status]');
  const hint = $('[data-hint]');
  const btnRotate = $<HTMLButtonElement>('[data-rotate]');
  const btnExplode = $<HTMLButtonElement>('[data-explode]');
  const btnReset = $<HTMLButtonElement>('[data-reset]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const explodeScale = Number(root.dataset.spread) || 1;

  root.dataset.state = 'loading';

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping; // keeps exported material colours close to true

  // Studio lighting: soft room reflections plus a warm key light from the upper left that turns with
  // the camera, so the lit side always faces the viewer, like a turntable.
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  pmrem.dispose();
  const camera = new PerspectiveCamera(30, 1, 0.01, 1000);
  const key = new DirectionalLight(0xfff3e6, 1.6);
  key.position.set(-1, 1.4, 1);
  camera.add(key);
  scene.add(camera);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(root.dataset.src!, (e) => {
    if (e.total) status.textContent = `Loading 3D model… ${Math.round((e.loaded / e.total) * 100)}%`;
  });
  const model = gltf.scene;
  // Centre it and scale to radius 1, so mm and m exports behave the same (damping, zoom limits, clipping).
  const raw = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
  model.scale.setScalar(1 / raw.radius);
  model.position.copy(raw.center).multiplyScalar(-1 / raw.radius);
  scene.add(model);
  scene.updateMatrixWorld(true);

  // Parts are the glTF nodes that carry geometry. A multi-material body loads as a group of meshes;
  // walking up to its node keeps those pieces together.
  const owners = new Set<Object3D>();
  model.traverse((o) => {
    if (!(o as Mesh).isMesh) return;
    let n: Object3D | null = o;
    while (n && n !== model && gltf.parser.associations.get(n)?.nodes === undefined) n = n.parent;
    owners.add(n && n !== model ? n : o);
  });

  const assembled = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
  const R = assembled.radius;
  const partBox = new Box3();
  const parts = [...owners].map((o) => {
    const dir = partBox.setFromObject(o).getCenter(new Vector3()).sub(assembled.center);
    const len = dir.length();
    // Every part clears the core a little; outer parts travel further, so the layout stays readable.
    const offset = len > R * 1e-3 ? dir.multiplyScalar(((0.25 * R + 0.8 * len) * explodeScale) / len) : dir.set(0, 0, 0);
    const to = o.parent!.worldToLocal(o.getWorldPosition(new Vector3()).add(offset));
    return { o, from: o.position.clone(), to };
  });

  const pose = (t: number) => parts.forEach((p) => p.o.position.lerpVectors(p.from, p.to, t));
  pose(1);
  model.updateMatrixWorld(true);
  const explodedBox = new Box3().setFromObject(model);
  // Furthest any part reaches from the orbit centre; tighter than one sphere around the whole box.
  const s = new Sphere();
  const RE = Math.max(R, ...parts.map((p) => partBox.setFromObject(p.o).getBoundingSphere(s).center.length() + s.radius));
  pose(0);
  if (parts.length < 2) btnExplode.hidden = true;

  // Soft contact shadow: a blurred ellipse just under the lowest point either pose reaches.
  const shadow = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.6 }),
  );
  const size = explodedBox.getSize(new Vector3());
  shadow.scale.set(Math.max(size.x, R) * 1.5, Math.max(size.z, R) * 1.5, 1);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = Math.min(explodedBox.min.y, -R) - R * 0.06;
  scene.add(shadow);

  camera.near = R / 100;
  camera.far = R * 100;

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.autoRotateSpeed = ROTATE_SPEED;
  controls.maxPolarAngle = Math.PI * 0.62; // not far below the shadow

  // Plain scrolling scrolls the page; pinch (ctrl+wheel on trackpads) or ctrl/cmd+wheel zooms.
  root.addEventListener('wheel', (e) => !e.ctrlKey && !e.metaKey && e.stopPropagation(), { capture: true });

  // Camera distance that fits a sphere of radius r in view, for the current aspect ratio.
  const fit = (r: number) => {
    const v = MathUtils.degToRad(camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * camera.aspect);
    return (r / Math.sin(Math.min(v, h))) * 1.08;
  };
  let t = 0; // explode amount, 0 assembled .. 1 exploded
  let fitNow = 0;
  const fitFor = (t: number) => MathUtils.lerp(fit(R), fit(RE), t);

  // Zooms the camera along with the explode (and resizes) without undoing the visitor's own zoom.
  function refit() {
    const next = fitFor(t);
    if (fitNow) camera.position.sub(controls.target).multiplyScalar(next / fitNow).add(controls.target);
    fitNow = next;
    controls.minDistance = fit(R) * 0.45;
    controls.maxDistance = fit(RE) * 1.8;
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    refit();
    wake();
  }

  // Render loop, only while something moves (auto-rotate, damping, a tween).
  let raf = 0;
  let ticking = false;
  let dirty = true;
  let last = 0;
  let visible = true;

  function frame(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
    last = now;
    ticking = true;
    const exploding = stepExplode(now);
    const tweening = stepReset(now) || exploding;
    const changed = controls.update(dt);
    ticking = false;
    if (tweening || changed || dirty) renderer.render(scene, camera);
    dirty = false;
    raf = visible && (tweening || changed || controls.autoRotate) ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  }

  function wake() {
    dirty = true;
    if (!raf && !ticking && visible) raf = requestAnimationFrame(frame);
  }

  // Explode tween; reversing mid-way takes only the time left.
  let tFrom = 0;
  let tTo = 0;
  let tStart = 0;
  let tDur = 0;

  function setT(v: number) {
    t = v;
    pose(t);
    shadow.material.opacity = MathUtils.lerp(0.6, 0.35, t);
    refit();
  }

  function stepExplode(now: number) {
    if (t === tTo) return false;
    const k = tDur ? Math.min((now - tStart) / tDur, 1) : 1;
    setT(k < 1 ? tFrom + (tTo - tFrom) * easeInOut(k) : tTo);
    return true;
  }

  btnExplode.addEventListener('click', () => {
    tTo = tTo ? 0 : 1;
    tFrom = t;
    tStart = performance.now();
    tDur = reduced ? 0 : EXPLODE_MS * Math.abs(tTo - tFrom);
    btnExplode.textContent = tTo ? 'Assemble' : 'Explode';
    wake();
  });

  // Rotation: the visitor's play/pause choice, with auto-rotate stepping aside while they drag.
  let playing = !reduced;
  let resumeTimer = 0;

  function setPlaying(on: boolean) {
    playing = on;
    clearTimeout(resumeTimer);
    controls.autoRotate = on && !resetting;
    btnRotate.textContent = on ? 'Pause' : 'Rotate';
    btnRotate.setAttribute('aria-label', on ? 'Pause rotation' : 'Start rotation');
    wake();
  }

  function interacted() {
    clearTimeout(resumeTimer);
    controls.autoRotate = false;
    root.dataset.touched = '';
  }

  function released() {
    clearTimeout(resumeTimer);
    if (playing) resumeTimer = window.setTimeout(() => setPlaying(true), RESUME_MS);
  }

  controls.addEventListener('start', interacted);
  controls.addEventListener('end', released);
  controls.addEventListener('change', wake);
  btnRotate.addEventListener('click', () => setPlaying(!playing));

  // Reset: glide back to the home view along the orbit (shortest way round), not through the model.
  const sph = new Spherical();
  const offset = new Vector3();
  let resetting = false;
  let rFrom = { radius: 0, phi: 0, theta: 0 };
  let rTo = { radius: 0, phi: 0, theta: 0 };
  let rStart = 0;

  function place(s: { radius: number; phi: number; theta: number }) {
    sph.set(s.radius, s.phi, s.theta);
    camera.position.setFromSpherical(sph).add(controls.target);
  }

  function stepReset(now: number) {
    if (!resetting) return false;
    const k = reduced ? 1 : Math.min((now - rStart) / RESET_MS, 1);
    const e = easeInOut(k);
    place({
      radius: MathUtils.lerp(rFrom.radius, rTo.radius, e),
      phi: MathUtils.lerp(rFrom.phi, rTo.phi, e),
      theta: MathUtils.lerp(rFrom.theta, rTo.theta, e),
    });
    if (k >= 1) {
      resetting = false;
      setPlaying(playing);
    }
    return true;
  }

  btnReset.addEventListener('click', () => {
    sph.setFromVector3(offset.copy(camera.position).sub(controls.target));
    const turn = Math.PI * 2;
    const dTheta = ((((HOME.theta - sph.theta + Math.PI) % turn) + turn) % turn) - Math.PI;
    rFrom = { radius: sph.radius, phi: sph.phi, theta: sph.theta };
    rTo = { radius: fitNow, phi: HOME.phi, theta: sph.theta + dTheta };
    rStart = performance.now();
    resetting = true;
    controls.autoRotate = false;
    wake();
  });

  // Keyboard: arrows orbit, +/- zoom, when the canvas has focus.
  canvas.addEventListener('keydown', (e) => {
    const turns: Record<string, [number, number]> = {
      ArrowLeft: [KEY_STEP, 0],
      ArrowRight: [-KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const zoom = e.key === '+' || e.key === '=' ? 0.85 : e.key === '-' ? 1 / 0.85 : 0;
    if (!turns[e.key] && !zoom) return;
    e.preventDefault();
    interacted();
    sph.setFromVector3(offset.copy(camera.position).sub(controls.target));
    if (zoom) sph.radius = MathUtils.clamp(sph.radius * zoom, controls.minDistance, controls.maxDistance);
    else {
      sph.theta += turns[e.key][0];
      sph.phi = MathUtils.clamp(sph.phi + turns[e.key][1], 0.05, controls.maxPolarAngle);
    }
    place(sph);
    released();
    wake();
  });

  hint.textContent = matchMedia('(hover: none)').matches
    ? 'Drag to rotate · pinch to zoom'
    : 'Drag to rotate · ctrl + scroll to zoom';

  resize();
  place({ radius: fitNow, ...HOME });
  setPlaying(playing);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  }).observe(root);

  renderer.render(scene, camera);
  status.textContent = '';
  root.dataset.state = 'ready';
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.75)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}
