import React,{
    useRef,
    useState,
    useCallback,
    forwardRef,
    useImperativeHandle,
    useEffect
} from "react";
import {
    ViewerApp,
    AssetManagerPlugin,
    GBufferPlugin,
    ProgressivePlugin,
    TonemapPlugin,
    SSRPlugin,
    SSAOPlugin,
    BloomPlugin,
    GammaCorrectionPlugin,
    // 设备检查
    mobileAndTabletCheck,

} from "webgi";
import gsap from "gsap"
// 滚动触发器
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollAnimation } from "../lib/scroll-animation";
// 触发滚动的动画
gsap.registerPlugin(ScrollTrigger)
const WebgiViewer = forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const [viewerRef, setViewerRef] = useState(null)
    const [targetRef,setTargetRef]=useState(null)
    const [cameraRef,setCameraRef]=useState(null)    
    const [positionRef, setPositionRef] = useState(null)
    const canvasContainerRef = useRef(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [isMobile, setIsMobile] = useState(null);

    useImperativeHandle(ref, () => ({
        triggerPreview() {
            setPreviewMode(true)
            canvasContainerRef.current.style.pointerEvents="all"
            props.contentRef.current.style.opacity ="0";
            gsap.to(positionRef, {
                x: 13,
                y: -2.01,
                z: 2.29,
                duration: 2,
                onUpdate: () => {
                    viewerRef.setDirty();
                    cameraRef.positionTargetUpdated(true);
                }
            });
            gsap.to(targetRef, { x: 0.11, y: 0.0, z: 0.0, duration: 2 })
            viewerRef.scene.activeCamera.setCameraOptions({controlsEnabled:true})
        }
    }))
    const memoizedScrollAnimation = useCallback(
        (position, target,isMobile, onUpdate) => {
            if (position && target && onUpdate) {
                scrollAnimation(position, target, isMobile,onUpdate);
            }
        },[]
    )
    const setupViewer =useCallback(async () => {
        const viewer = new ViewerApp({
            // 获取画布
            canvas: canvasRef.current,
        })
        setViewerRef(viewer)
        // 调用
        const isMobileOrTablet = mobileAndTabletCheck();
        setIsMobile(isMobileOrTablet)
        // 查看器基本插件
        const manager = await viewer.addPlugin(AssetManagerPlugin)  
        // 开启相机
        const camera = viewer.scene.activeCamera;
        // 点击一次的位置等于相机的一个位置
        const position = camera.position;
        const target = camera.target;
        setCameraRef(camera);
        setPositionRef(position);
        setTargetRef(target)
        //缓冲区插件
        await viewer.addPlugin(GBufferPlugin)
        await viewer.addPlugin(new ProgressivePlugin(32))
        await viewer.addPlugin(new TonemapPlugin(true))
        await viewer.addPlugin(GammaCorrectionPlugin)
        await viewer.addPlugin(SSRPlugin)
        await viewer.addPlugin(SSAOPlugin)
        await viewer.addPlugin(BloomPlugin)
        // 调用此查看器渲染刷新管道
        viewer.renderer.refreshPipeline()
        // 添加3D模型
        await manager.addFromPath("scene-black.glb");
        // 添加剪辑背景
        viewer.getPlugin(TonemapPlugin).config.clipBackground = true;
        viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false })
        // 设置平板的位置
        if (isMobileOrTablet) {
            position.set(-16.7, 1.17, 11.7);
            target.set(0, 1.37, 0)
            props.contentRef.current.className="mobile-or-tablet"
        }
        // 设定模型的位置
        window.scrollTo(0, 0);
        let needsUpdate = true;
        const onUpdate = () => {
            needsUpdate = true;
            viewer.setDirty();
        }
        viewer.addEventListener("preFrame", () => {
            if (needsUpdate) {
                 // 调用相机
                camera.positionTargetUpdated(true);
                needsUpdate = false;
            }
           
        })
        memoizedScrollAnimation(position,target,isMobileOrTablet,onUpdate)
    },[]);
// 设置查看器
    useEffect(() => {
        setupViewer();
    }, []);
        // Initialize the viewer
    const handleExit = useCallback(() => {
        canvasContainerRef.current.style.pointerEvents="none"
        props.contentRef.current.style.opacity ="1";
        viewerRef.scene.activeCamera.setCameraOptions({ controlsEnabled: false })
        setPreviewMode(false);
        gsap.to(positionRef, {
            x:!isMobile?1.56:9.36,
            y: !isMobile?5.0:10.95,
            z: !isMobile?0.01:0.09,
            scrollTrigger: {
                trigger: '.display-section',
                start: 'top bottom',
                end: "top top",
                scrub: 2,
                immediateRender: false
            },
            onUpdateL:()=> {
                viewerRef.setDirty();
                cameraRef.positionTargetUpdated(true)
            }
        })
        gsap.to(targetRef, {
            x: !isMobile?-0.55:-1.62,
            y: !isMobile?0.32:0.02,
            z: !isMobile?0.0:-0.06,
            scrollTrigger: {
                trigger: '.display-section',
                start: 'top bottom',
                end: "top top",
                scrub: 2,
                immediateRender: false
            },
        })
      },[canvasContainerRef,viewerRef,positionRef,cameraRef,targetRef])
    
    return (
        <div ref={canvasContainerRef} id="webgi-canvas-container">
            <canvas id="webgi-canvas" ref={canvasRef} />
            {
                previewMode && (
                    <button className="button" onClick={handleExit}>Exit</button>
                )
            }
    </div>  );

 }) 
  

export default WebgiViewer;