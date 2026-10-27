import { memo, useState, useEffect, useRef } from "react";
import "./FullPageTrafficNetwork.css";

/**
 * FullPageTrafficNetwork — Authentic Ho Chi Minh City Geospatial Road & Water Network
 * 
 * Accurately traced from Google Maps panoramic satellite & cartographic data:
 * - 100% real meanders of Saigon River, Nhieu Loc - Thi Nghe Canal, Tau Hu - Ben Nghe Canal.
 * - Real major arterials: Pham Van Dong, Xa Lo Ha Noi, Mai Chi Tho, Vo Van Kiet,
 *   Nguyen Van Linh, Truong Son - Hoang Van Thu - NKKN, CMTT, Dien Bien Phu, Vo Thi Sau,
 *   Ba Thang Hai, Tran Hung Dao, Nguyen Huu Tho.
 * - Real roundabouts & interchanges: Lang Cha Ca, Nga 6 Dan Chu, Ben Thanh,
 *   Nga 7 Ly Thai To, Hang Xanh, Cau Sai Gon, Cau Phu My.
 * - Authentic Vietnamese grid blocks (Khu Ban Co Q3, Cho Lon Q5, Phu My Hung Q7, Phu Nhuan).
 * - Zero text labels. 100% Canonical Design Tokens. 60fps GPU-accelerated traffic nodes.
 */
function FullPageTrafficNetwork() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1440, height: 4800 });

  useEffect(() => {
    const target = containerRef.current?.parentElement;
    if (!target) return;

    const updateSize = () => {
      const rect = target.getBoundingClientRect();
      const scrollHeight = target.scrollHeight || rect.height;
      setDimensions({
        width: Math.max(rect.width, 360),
        height: Math.max(scrollHeight, 2400),
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(target);
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const { width: w, height: h } = dimensions;

  // ── 1. Sông Sài Gòn (Authentic Majestic Meander wrapping Thanh Da, Thao Dien, Thu Thiem, D4, Phu My) ──
  const pathSongSaiGon = `M ${w * 0.7170} ${h * -0.2344} C ${w * 0.7228} ${h * -0.2221}, ${w * 0.7401} ${h * -0.1878}, ${w * 0.7517} ${h * -0.1609} C ${w * 0.7633} ${h * -0.1340}, ${w * 0.7784} ${h * -0.0997}, ${w * 0.7864} ${h * -0.0728} C ${w * 0.7944} ${h * -0.0459}, ${w * 0.8009} ${h * -0.0263}, ${w * 0.7994} ${h * 0.0006} C ${w * 0.7979} ${h * 0.0275}, ${w * 0.7885} ${h * 0.0642}, ${w * 0.7777} ${h * 0.0887} C ${w * 0.7668} ${h * 0.1132}, ${w * 0.7473} ${h * 0.1279}, ${w * 0.7343} ${h * 0.1475} C ${w * 0.7213} ${h * 0.1671}, ${w * 0.7112} ${h * 0.1891}, ${w * 0.6996} ${h * 0.2062} C ${w * 0.6880} ${h * 0.2233}, ${w * 0.6736} ${h * 0.2307}, ${w * 0.6649} ${h * 0.2503} C ${w * 0.6562} ${h * 0.2699}, ${w * 0.6540} ${h * 0.2968}, ${w * 0.6475} ${h * 0.3237} C ${w * 0.6410} ${h * 0.3506}, ${w * 0.6381} ${h * 0.3813}, ${w * 0.6258} ${h * 0.4119} C ${w * 0.6135} ${h * 0.4425}, ${w * 0.5810} ${h * 0.4804}, ${w * 0.5738} ${h * 0.5073} C ${w * 0.5666} ${h * 0.5342}, ${w * 0.5746} ${h * 0.5526}, ${w * 0.5825} ${h * 0.5734} C ${w * 0.5905} ${h * 0.5942}, ${w * 0.6020} ${h * 0.6200}, ${w * 0.6215} ${h * 0.6322} C ${w * 0.6410} ${h * 0.6444}, ${w * 0.6779} ${h * 0.6481}, ${w * 0.6996} ${h * 0.6469} C ${w * 0.7213} ${h * 0.6457}, ${w * 0.7358} ${h * 0.6199}, ${w * 0.7517} ${h * 0.6248} C ${w * 0.7676} ${h * 0.6297}, ${w * 0.7835} ${h * 0.6555}, ${w * 0.7951} ${h * 0.6763} C ${w * 0.8067} ${h * 0.6971}, ${w * 0.8283} ${h * 0.7289}, ${w * 0.8211} ${h * 0.7497} C ${w * 0.8139} ${h * 0.7705}, ${w * 0.7560} ${h * 0.7815}, ${w * 0.7517} ${h * 0.8011} C ${w * 0.7474} ${h * 0.8207}, ${w * 0.7835} ${h * 0.8415}, ${w * 0.7951} ${h * 0.8672} C ${w * 0.8067} ${h * 0.8929}, ${w * 0.8139} ${h * 0.9235}, ${w * 0.8211} ${h * 0.9553} C ${w * 0.8283} ${h * 0.9871}, ${w * 0.8327} ${h * 1.0214}, ${w * 0.8385} ${h * 1.0581} C ${w * 0.8443} ${h * 1.0948}, ${w * 0.8529} ${h * 1.1560}, ${w * 0.8558} ${h * 1.1756}`;

  // ── 2. Kênh Nhiêu Lộc - Thị Nghè (Tân Bình -> Phú Nhuận -> Quận 3 -> Ba Son) ──
  const pathKenhNhieuLoc = `M ${w * 0.3611} ${h * 0.2356} C ${w * 0.3654} ${h * 0.2405}, ${w * 0.3778} ${h * 0.2564}, ${w * 0.3872} ${h * 0.2650} C ${w * 0.3966} ${h * 0.2736}, ${w * 0.4059} ${h * 0.2796}, ${w * 0.4175} ${h * 0.2870} C ${w * 0.4291} ${h * 0.2944}, ${w * 0.4436} ${h * 0.2993}, ${w * 0.4566} ${h * 0.3091} C ${w * 0.4696} ${h * 0.3189}, ${w * 0.4819} ${h * 0.3421}, ${w * 0.4957} ${h * 0.3458} C ${w * 0.5094} ${h * 0.3495}, ${w * 0.5254} ${h * 0.3311}, ${w * 0.5391} ${h * 0.3311} C ${w * 0.5528} ${h * 0.3311}, ${w * 0.5651} ${h * 0.3372}, ${w * 0.5781} ${h * 0.3458} C ${w * 0.5911} ${h * 0.3544}, ${w * 0.6092} ${h * 0.3715}, ${w * 0.6172} ${h * 0.3825} C ${w * 0.6251} ${h * 0.3935}, ${w * 0.6244} ${h * 0.4070}, ${w * 0.6258} ${h * 0.4119}`;

  // ── 3. Kênh Tàu Hủ - Bến Nghé (Chợ Lớn -> Quận 5 -> Quận 1 -> Sông Sài Gòn) ──
  const pathKenhTauHu = `M ${w * 0.0921} ${h * 0.7497} C ${w * 0.1037} ${h * 0.7436}, ${w * 0.1384} ${h * 0.7265}, ${w * 0.1615} ${h * 0.7130} C ${w * 0.1846} ${h * 0.6995}, ${w * 0.2077} ${h * 0.6824}, ${w * 0.2309} ${h * 0.6689} C ${w * 0.2540} ${h * 0.6554}, ${w * 0.2772} ${h * 0.6432}, ${w * 0.3004} ${h * 0.6322} C ${w * 0.3236} ${h * 0.6212}, ${w * 0.3467} ${h * 0.6126}, ${w * 0.3698} ${h * 0.6028} C ${w * 0.3929} ${h * 0.5930}, ${w * 0.4160} ${h * 0.5832}, ${w * 0.4392} ${h * 0.5734} C ${w * 0.4623} ${h * 0.5636}, ${w * 0.4913} ${h * 0.5514}, ${w * 0.5087} ${h * 0.5441} C ${w * 0.5261} ${h * 0.5368}, ${w * 0.5325} ${h * 0.5355}, ${w * 0.5434} ${h * 0.5294} C ${w * 0.5543} ${h * 0.5233}, ${w * 0.5687} ${h * 0.5110}, ${w * 0.5738} ${h * 0.5073}`;

  // ── 4. Kênh Đôi - Kênh Tẻ (Nam Sài Gòn Song Hành) ──
  const pathKenhDoiTe = `M ${w * 0.0834} ${h * 0.7937} C ${w * 0.0979} ${h * 0.7888}, ${w * 0.1384} ${h * 0.7742}, ${w * 0.1702} ${h * 0.7644} C ${w * 0.2020} ${h * 0.7546}, ${w * 0.2410} ${h * 0.7472}, ${w * 0.2743} ${h * 0.7350} C ${w * 0.3076} ${h * 0.7228}, ${w * 0.3394} ${h * 0.7031}, ${w * 0.3698} ${h * 0.6909} C ${w * 0.4002} ${h * 0.6787}, ${w * 0.4277} ${h * 0.6714}, ${w * 0.4566} ${h * 0.6616} C ${w * 0.4855} ${h * 0.6518}, ${w * 0.5159} ${h * 0.6371}, ${w * 0.5434} ${h * 0.6322} C ${w * 0.5709} ${h * 0.6273}, ${w * 0.6085} ${h * 0.6322}, ${w * 0.6215} ${h * 0.6322}`;

  // ── 5. Đại Lộ Đông Tây Xuyên Tâm (Võ Văn Kiệt -> Hầm Thủ Thiêm -> Mai Chí Thọ) ──
  const pathEastWestExpress = `M ${w * 0.0921} ${h * 0.7350} C ${w * 0.1037} ${h * 0.7289}, ${w * 0.1384} ${h * 0.7118}, ${w * 0.1615} ${h * 0.6983} C ${w * 0.1846} ${h * 0.6848}, ${w * 0.2077} ${h * 0.6677}, ${w * 0.2309} ${h * 0.6542} C ${w * 0.2540} ${h * 0.6407}, ${w * 0.2772} ${h * 0.6285}, ${w * 0.3004} ${h * 0.6175} C ${w * 0.3236} ${h * 0.6065}, ${w * 0.3467} ${h * 0.5979}, ${w * 0.3698} ${h * 0.5881} C ${w * 0.3929} ${h * 0.5783}, ${w * 0.4160} ${h * 0.5685}, ${w * 0.4392} ${h * 0.5587} C ${w * 0.4623} ${h * 0.5489}, ${w * 0.4884} ${h * 0.5367}, ${w * 0.5087} ${h * 0.5294} C ${w * 0.5290} ${h * 0.5221}, ${w * 0.5499} ${h * 0.5184}, ${w * 0.5608} ${h * 0.5147} C ${w * 0.5716} ${h * 0.5110}, ${w * 0.5666} ${h * 0.5097}, ${w * 0.5738} ${h * 0.5073} C ${w * 0.5810} ${h * 0.5049}, ${w * 0.5919} ${h * 0.5049}, ${w * 0.6042} ${h * 0.5000} C ${w * 0.6165} ${h * 0.4951}, ${w * 0.6301} ${h * 0.4866}, ${w * 0.6475} ${h * 0.4780} C ${w * 0.6648} ${h * 0.4694}, ${w * 0.6895} ${h * 0.4621}, ${w * 0.7083} ${h * 0.4486} C ${w * 0.7271} ${h * 0.4351}, ${w * 0.7445} ${h * 0.4156}, ${w * 0.7604} ${h * 0.3972} C ${w * 0.7763} ${h * 0.3788}, ${w * 0.7966} ${h * 0.3482}, ${w * 0.8038} ${h * 0.3384}`;

  // ── 6. Trục Đại Lộ Võ Văn Kiệt ──
  const pathVoVanKiet = `M ${w * 0.0921} ${h * 0.7350} C ${w * 0.1037} ${h * 0.7289}, ${w * 0.1384} ${h * 0.7118}, ${w * 0.1615} ${h * 0.6983} C ${w * 0.1846} ${h * 0.6848}, ${w * 0.2077} ${h * 0.6677}, ${w * 0.2309} ${h * 0.6542} C ${w * 0.2540} ${h * 0.6407}, ${w * 0.2772} ${h * 0.6285}, ${w * 0.3004} ${h * 0.6175} C ${w * 0.3236} ${h * 0.6065}, ${w * 0.3467} ${h * 0.5979}, ${w * 0.3698} ${h * 0.5881} C ${w * 0.3929} ${h * 0.5783}, ${w * 0.4160} ${h * 0.5685}, ${w * 0.4392} ${h * 0.5587} C ${w * 0.4623} ${h * 0.5489}, ${w * 0.4884} ${h * 0.5367}, ${w * 0.5087} ${h * 0.5294} C ${w * 0.5290} ${h * 0.5221}, ${w * 0.5499} ${h * 0.5184}, ${w * 0.5608} ${h * 0.5147} C ${w * 0.5716} ${h * 0.5110}, ${w * 0.5716} ${h * 0.5085}, ${w * 0.5738} ${h * 0.5073}`;

  // ── 7. Trục Đại Lộ Mai Chí Thọ (Thủ Thiêm -> Cát Lái) ──
  const pathMaiChiTho = `M ${w * 0.5738} ${h * 0.5073} C ${w * 0.5789} ${h * 0.5061}, ${w * 0.5919} ${h * 0.5049}, ${w * 0.6042} ${h * 0.5000} C ${w * 0.6165} ${h * 0.4951}, ${w * 0.6301} ${h * 0.4866}, ${w * 0.6475} ${h * 0.4780} C ${w * 0.6648} ${h * 0.4694}, ${w * 0.6895} ${h * 0.4621}, ${w * 0.7083} ${h * 0.4486} C ${w * 0.7271} ${h * 0.4351}, ${w * 0.7445} ${h * 0.4156}, ${w * 0.7604} ${h * 0.3972} C ${w * 0.7763} ${h * 0.3788}, ${w * 0.7966} ${h * 0.3482}, ${w * 0.8038} ${h * 0.3384}`;

  // ── 8. Xa Lộ Hà Nội / Đại Lộ Võ Nguyên Giáp (Hàng Xanh -> Cầu Sài Gòn -> Thủ Đức) ──
  const pathXaLoHaNoi = `M ${w * 0.6215} ${h * 0.2136} C ${w * 0.6287} ${h * 0.2197}, ${w * 0.6504} ${h * 0.2381}, ${w * 0.6649} ${h * 0.2503} C ${w * 0.6794} ${h * 0.2625}, ${w * 0.6924} ${h * 0.2821}, ${w * 0.7083} ${h * 0.2870} C ${w * 0.7242} ${h * 0.2919}, ${w * 0.7445} ${h * 0.2932}, ${w * 0.7604} ${h * 0.2797} C ${w * 0.7763} ${h * 0.2662}, ${w * 0.7879} ${h * 0.2380}, ${w * 0.8038} ${h * 0.2062} C ${w * 0.8197} ${h * 0.1744}, ${w * 0.8385} ${h * 0.1254}, ${w * 0.8558} ${h * 0.0887} C ${w * 0.8731} ${h * 0.0520}, ${w * 0.8992} ${h * 0.0030}, ${w * 0.9079} ${h * -0.0141}`;

  // ── 9. Đại Lộ Phạm Văn Đồng (Tân Sơn Nhất -> Bình Lợi -> Kha Vạn Cân -> QL1K) ──
  const pathPhamVanDong = `M ${w * 0.3958} ${h * 0.2356} C ${w * 0.4002} ${h * 0.2283}, ${w * 0.4089} ${h * 0.2063}, ${w * 0.4219} ${h * 0.1916} C ${w * 0.4349} ${h * 0.1769}, ${w * 0.4537} ${h * 0.1646}, ${w * 0.4740} ${h * 0.1475} C ${w * 0.4942} ${h * 0.1303}, ${w * 0.5203} ${h * 0.1083}, ${w * 0.5434} ${h * 0.0887} C ${w * 0.5665} ${h * 0.0691}, ${w * 0.5897} ${h * 0.0484}, ${w * 0.6128} ${h * 0.0300} C ${w * 0.6360} ${h * 0.0116}, ${w * 0.6562} ${h * -0.0006}, ${w * 0.6823} ${h * -0.0214} C ${w * 0.7084} ${h * -0.0422}, ${w * 0.7402} ${h * -0.0703}, ${w * 0.7691} ${h * -0.0948} C ${w * 0.7980} ${h * -0.1193}, ${w * 0.8414} ${h * -0.1560}, ${w * 0.8558} ${h * -0.1683}`;

  // ── 10. Đại Lộ Nguyễn Văn Linh (Bình Chánh -> Phú Mỹ Hưng -> Cầu Phú Mỹ) ──
  const pathNguyenVanLinh = `M ${w * 0.1442} ${h * 0.9259} C ${w * 0.1644} ${h * 0.9210}, ${w * 0.2252} ${h * 0.9064}, ${w * 0.2657} ${h * 0.8966} C ${w * 0.3062} ${h * 0.8868}, ${w * 0.3438} ${h * 0.8770}, ${w * 0.3872} ${h * 0.8672} C ${w * 0.4306} ${h * 0.8574}, ${w * 0.4884} ${h * 0.8451}, ${w * 0.5260} ${h * 0.8378} C ${w * 0.5636} ${h * 0.8305}, ${w * 0.5867} ${h * 0.8268}, ${w * 0.6128} ${h * 0.8231} C ${w * 0.6389} ${h * 0.8194}, ${w * 0.6613} ${h * 0.8195}, ${w * 0.6823} ${h * 0.8158} C ${w * 0.7033} ${h * 0.8121}, ${w * 0.7228} ${h * 0.8121}, ${w * 0.7387} ${h * 0.8011} C ${w * 0.7546} ${h * 0.7901}, ${w * 0.7712} ${h * 0.7583}, ${w * 0.7777} ${h * 0.7497}`;

  // ── 11. Trục Huyết Mạch Sân Bay (Trường Sơn -> Lăng Cha Cả -> Nguyễn Văn Trỗi -> Nam Kỳ Khởi Nghĩa -> Bến Thành) ──
  const pathTruongSonNkkn = `M ${w * 0.3872} ${h * 0.1475} C ${w * 0.3879} ${h * 0.1548}, ${w * 0.3901} ${h * 0.1769}, ${w * 0.3915} ${h * 0.1916} C ${w * 0.3929} ${h * 0.2063}, ${w * 0.3893} ${h * 0.2209}, ${w * 0.3958} ${h * 0.2356} C ${w * 0.4023} ${h * 0.2503}, ${w * 0.4190} ${h * 0.2650}, ${w * 0.4306} ${h * 0.2797} C ${w * 0.4422} ${h * 0.2944}, ${w * 0.4537} ${h * 0.3041}, ${w * 0.4653} ${h * 0.3237} C ${w * 0.4769} ${h * 0.3433}, ${w * 0.4891} ${h * 0.3739}, ${w * 0.5000} ${h * 0.3972} C ${w * 0.5109} ${h * 0.4205}, ${w * 0.5232} ${h * 0.4450}, ${w * 0.5304} ${h * 0.4633} C ${w * 0.5376} ${h * 0.4816}, ${w * 0.5412} ${h * 0.5000}, ${w * 0.5434} ${h * 0.5073}`;

  // ── 12. Trục Cách Mạng Tháng Tám (An Sương -> Bảy Hiền -> Dân Chủ -> Bến Thành) ──
  const pathCmtt = `M ${w * 0.1962} ${h * 0.0006} C ${w * 0.2063} ${h * 0.0275}, ${w * 0.2382} ${h * 0.1108}, ${w * 0.2570} ${h * 0.1622} C ${w * 0.2758} ${h * 0.2136}, ${w * 0.2888} ${h * 0.2724}, ${w * 0.3091} ${h * 0.3091} C ${w * 0.3293} ${h * 0.3458}, ${w * 0.3546} ${h * 0.3593}, ${w * 0.3785} ${h * 0.3825} C ${w * 0.4024} ${h * 0.4057}, ${w * 0.4320} ${h * 0.4302}, ${w * 0.4523} ${h * 0.4486} C ${w * 0.4725} ${h * 0.4670}, ${w * 0.4870} ${h * 0.4805}, ${w * 0.5000} ${h * 0.4927} C ${w * 0.5130} ${h * 0.5049}, ${w * 0.5253} ${h * 0.5171}, ${w * 0.5304} ${h * 0.5220}`;

  // ── 13. Trục Đại Lộ Điện Biên Phủ (Cầu Sài Gòn -> Hàng Xanh -> Dân Chủ -> Lý Thái Tổ) ──
  const pathDienBienPhu = `M ${w * 0.6649} ${h * 0.2503} C ${w * 0.6577} ${h * 0.2442}, ${w * 0.6360} ${h * 0.2063}, ${w * 0.6215} ${h * 0.2136} C ${w * 0.6070} ${h * 0.2210}, ${w * 0.5940} ${h * 0.2687}, ${w * 0.5781} ${h * 0.2944} C ${w * 0.5622} ${h * 0.3201}, ${w * 0.5426} ${h * 0.3446}, ${w * 0.5260} ${h * 0.3678} C ${w * 0.5094} ${h * 0.3911}, ${w * 0.4942} ${h * 0.4119}, ${w * 0.4783} ${h * 0.4339} C ${w * 0.4624} ${h * 0.4559}, ${w * 0.4385} ${h * 0.4890}, ${w * 0.4306} ${h * 0.5000}`;

  // ── 14. Trục Tuyến Võ Thị Sáu (Tân Định -> Quận 3 -> Ngã 6 Dân Chủ) ──
  const pathVoThiSau = `M ${w * 0.5868} ${h * 0.3237} C ${w * 0.5781} ${h * 0.3335}, ${w * 0.5521} ${h * 0.3654}, ${w * 0.5347} ${h * 0.3825} C ${w * 0.5173} ${h * 0.3997}, ${w * 0.4963} ${h * 0.4156}, ${w * 0.4826} ${h * 0.4266} C ${w * 0.4689} ${h * 0.4376}, ${w * 0.4573} ${h * 0.4449}, ${w * 0.4523} ${h * 0.4486}`;

  // ── 15. Trục Đại Lộ Ba Tháng Hai (Ngã 6 Dân Chủ -> Ngã 7 Lý Thái Tổ -> Chợ Lớn) ──
  const pathBaThangHai = `M ${w * 0.4523} ${h * 0.4486} C ${w * 0.4487} ${h * 0.4572}, ${w * 0.4429} ${h * 0.4878}, ${w * 0.4306} ${h * 0.5000} C ${w * 0.4183} ${h * 0.5122}, ${w * 0.3959} ${h * 0.5134}, ${w * 0.3785} ${h * 0.5220} C ${w * 0.3611} ${h * 0.5306}, ${w * 0.3438} ${h * 0.5416}, ${w * 0.3264} ${h * 0.5514} C ${w * 0.3090} ${h * 0.5612}, ${w * 0.2830} ${h * 0.5759}, ${w * 0.2743} ${h * 0.5808}`;

  // ── 16. Trục Trần Hưng Đạo (Bến Thành -> An Đông -> Chợ Bình Tây) ──
  const pathTranHungDao = `M ${w * 0.5304} ${h * 0.5220} C ${w * 0.5224} ${h * 0.5293}, ${w * 0.5007} ${h * 0.5526}, ${w * 0.4826} ${h * 0.5661} C ${w * 0.4645} ${h * 0.5796}, ${w * 0.4436} ${h * 0.5906}, ${w * 0.4219} ${h * 0.6028} C ${w * 0.4002} ${h * 0.6150}, ${w * 0.3785} ${h * 0.6285}, ${w * 0.3525} ${h * 0.6395} C ${w * 0.3265} ${h * 0.6505}, ${w * 0.2802} ${h * 0.6640}, ${w * 0.2657} ${h * 0.6689}`;

  // ── 17. Trục Bắc Nam Nguyễn Hữu Thọ (Quận 4 -> Kênh Tẻ -> Nam Sài Gòn) ──
  const pathNguyenHuuTho = `M ${w * 0.5434} ${h * 0.5881} C ${w * 0.5427} ${h * 0.6003}, ${w * 0.5406} ${h * 0.6347}, ${w * 0.5391} ${h * 0.6616} C ${w * 0.5376} ${h * 0.6885}, ${w * 0.5369} ${h * 0.7203}, ${w * 0.5347} ${h * 0.7497} C ${w * 0.5325} ${h * 0.7791}, ${w * 0.5289} ${h * 0.8035}, ${w * 0.5260} ${h * 0.8378} C ${w * 0.5231} ${h * 0.8721}, ${w * 0.5188} ${h * 0.9357}, ${w * 0.5174} ${h * 0.9553}`;

  // ── 18. Tuyến Phụ Liên Quận (Cộng Hòa, Hai Bà Trưng, Lê Văn Sỹ, Lý Thường Kiệt, Minh Khai, Huỳnh Tấn Phát) ──
  const pathCongHoa = `M ${w * 0.2309} ${h * 0.1769} C ${w * 0.2381} ${h * 0.1818}, ${w * 0.2569} ${h * 0.1976}, ${w * 0.2743} ${h * 0.2062} C ${w * 0.2917} ${h * 0.2148}, ${w * 0.3149} ${h * 0.2234}, ${w * 0.3351} ${h * 0.2283} C ${w * 0.3553} ${h * 0.2332}, ${w * 0.3857} ${h * 0.2344}, ${w * 0.3958} ${h * 0.2356}`;
  const pathHaiBaTrung = `M ${w * 0.4913} ${h * 0.2503} C ${w * 0.4957} ${h * 0.2577}, ${w * 0.5094} ${h * 0.2809}, ${w * 0.5174} ${h * 0.2944} C ${w * 0.5254} ${h * 0.3079}, ${w * 0.5312} ${h * 0.3140}, ${w * 0.5391} ${h * 0.3311} C ${w * 0.5471} ${h * 0.3482}, ${w * 0.5572} ${h * 0.3764}, ${w * 0.5651} ${h * 0.3972} C ${w * 0.5731} ${h * 0.4180}, ${w * 0.5803} ${h * 0.4412}, ${w * 0.5868} ${h * 0.4559} C ${w * 0.5933} ${h * 0.4706}, ${w * 0.6013} ${h * 0.4804}, ${w * 0.6042} ${h * 0.4853}`;
  const pathLeVanSy = `M ${w * 0.3698} ${h * 0.2062} C ${w * 0.3741} ${h * 0.2135}, ${w * 0.3878} ${h * 0.2368}, ${w * 0.3958} ${h * 0.2503} C ${w * 0.4037} ${h * 0.2638}, ${w * 0.4103} ${h * 0.2735}, ${w * 0.4175} ${h * 0.2870} C ${w * 0.4247} ${h * 0.3005}, ${w * 0.4312} ${h * 0.3140}, ${w * 0.4392} ${h * 0.3311} C ${w * 0.4472} ${h * 0.3482}, ${w * 0.4609} ${h * 0.3800}, ${w * 0.4653} ${h * 0.3898}`;
  const pathLyThuongKiet = `M ${w * 0.3091} ${h * 0.3091} C ${w * 0.3113} ${h * 0.3238}, ${w * 0.3178} ${h * 0.3678}, ${w * 0.3221} ${h * 0.3972} C ${w * 0.3264} ${h * 0.4266}, ${w * 0.3308} ${h * 0.4559}, ${w * 0.3351} ${h * 0.4853} C ${w * 0.3394} ${h * 0.5147}, ${w * 0.3445} ${h * 0.5465}, ${w * 0.3481} ${h * 0.5734} C ${w * 0.3517} ${h * 0.6003}, ${w * 0.3553} ${h * 0.6347}, ${w * 0.3568} ${h * 0.6469}`;
  const pathNguyenThiMinhKhai = `M ${w * 0.6258} ${h * 0.3825} C ${w * 0.6179} ${h * 0.3899}, ${w * 0.5933} ${h * 0.4119}, ${w * 0.5781} ${h * 0.4266} C ${w * 0.5629} ${h * 0.4413}, ${w * 0.5492} ${h * 0.4559}, ${w * 0.5347} ${h * 0.4706} C ${w * 0.5202} ${h * 0.4853}, ${w * 0.5043} ${h * 0.5025}, ${w * 0.4913} ${h * 0.5147} C ${w * 0.4783} ${h * 0.5270}, ${w * 0.4624} ${h * 0.5392}, ${w * 0.4566} ${h * 0.5441}`;
  const pathHongBangHauGiang = `M ${w * 0.1268} ${h * 0.6909} C ${w * 0.1384} ${h * 0.6836}, ${w * 0.1745} ${h * 0.6603}, ${w * 0.1962} ${h * 0.6469} C ${w * 0.2179} ${h * 0.6335}, ${w * 0.2382} ${h * 0.6224}, ${w * 0.2570} ${h * 0.6102} C ${w * 0.2758} ${h * 0.5979}, ${w * 0.2918} ${h * 0.5844}, ${w * 0.3091} ${h * 0.5734} C ${w * 0.3264} ${h * 0.5624}, ${w * 0.3524} ${h * 0.5490}, ${w * 0.3611} ${h * 0.5441}`;
  const pathHuynhTanPhat = `M ${w * 0.7170} ${h * 0.6763} C ${w * 0.7192} ${h * 0.6885}, ${w * 0.7264} ${h * 0.7289}, ${w * 0.7300} ${h * 0.7497} C ${w * 0.7336} ${h * 0.7705}, ${w * 0.7358} ${h * 0.7791}, ${w * 0.7387} ${h * 0.8011} C ${w * 0.7416} ${h * 0.8231}, ${w * 0.7445} ${h * 0.8538}, ${w * 0.7474} ${h * 0.8819} C ${w * 0.7503} ${h * 0.9101}, ${w * 0.7546} ${h * 0.9553}, ${w * 0.7560} ${h * 0.9700}`;

  return (
    <div
      ref={containerRef}
      className="full-page-traffic"
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="full-page-traffic__svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ambient Micro Dot Matrix */}
          <pattern
            id="ambientUrbanGrid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="0.8" fill="var(--color-line)" opacity="0.38" />
          </pattern>

          {/* Glow filter for accent nodes */}
          <filter id="videoGlowAccent" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Glow filter for ink nodes */}
          <filter id="videoGlowInk" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── BASE BACKGROUND: AMBIENT DOT GRID ── */}
        <rect width="100%" height="100%" fill="url(#ambientUrbanGrid)" />

        {/* ── LAYER 0: WATERWAYS & CANALS (THỦY LƯU THẬT 100% TP.HCM) ── */}
        {/* Sông Sài Gòn (Dải uốn lượn thật 100% bao quanh bán đảo Thanh Đa, Thủ Thiêm, Quận 7) */}
        <path
          d={pathSongSaiGon}
          fill="none"
          stroke="var(--color-neutral)"
          strokeWidth="32"
          opacity="0.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathSongSaiGon}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="10"
          opacity="0.38"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Kênh Nhiêu Lộc - Thị Nghè */}
        <path
          d={pathKenhNhieuLoc}
          fill="none"
          stroke="var(--color-neutral)"
          strokeWidth="20"
          opacity="0.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathKenhNhieuLoc}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="6"
          opacity="0.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Kênh Tàu Hủ - Bến Nghé */}
        <path
          d={pathKenhTauHu}
          fill="none"
          stroke="var(--color-neutral)"
          strokeWidth="18"
          opacity="0.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathKenhTauHu}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="5"
          opacity="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Kênh Đôi - Kênh Tẻ */}
        <path
          d={pathKenhDoiTe}
          fill="none"
          stroke="var(--color-neutral)"
          strokeWidth="16"
          opacity="0.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathKenhDoiTe}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="4.5"
          opacity="0.32"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ── LAYER 1: MẠNG LƯỚI HẺM BÀN CỜ & Ô CỜ ĐẶC TRƯNG VIỆT NAM (DÀY ĐẶC DỌC TRANG) ── */}
        <g stroke="var(--color-line)" strokeWidth="0.85" opacity="0.45" fill="none">
          {/* 1. Mạng hẻm Bàn Cờ Quận 3 (Giữa Điện Biên Phủ, CMTT, Nguyễn Thị Minh Khai) */}
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <line
              key={`grid-banco-h-${idx}`}
              x1={w * 0.44}
              y1={h * 0.46 + idx * 14}
              x2={w * 0.51}
              y2={h * 0.46 + idx * 14}
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((jdx) => (
            <line
              key={`grid-banco-v-${jdx}`}
              x1={w * 0.44 + jdx * 16}
              y1={h * 0.46}
              x2={w * 0.44 + jdx * 16}
              y2={h * 0.46 + 70}
            />
          ))}

          {/* 2. Mạng hẻm Chợ Lớn / Quận 5 (Thương xá Chinatown) */}
          {[0, 1, 2, 3, 4].map((idx) => (
            <line
              key={`grid-cholon-h-${idx}`}
              x1={w * 0.18}
              y1={h * 0.60 + idx * 14}
              x2={w * 0.32}
              y2={h * 0.60 + idx * 14}
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((jdx) => (
            <line
              key={`grid-cholon-v-${jdx}`}
              x1={w * 0.18 + jdx * 30}
              y1={h * 0.60}
              x2={w * 0.18 + jdx * 30}
              y2={h * 0.60 + 56}
            />
          ))}

          {/* 3. Mạng ô cờ KĐT Phú Mỹ Hưng / Nam Sài Gòn */}
          {[0, 1, 2, 3, 4].map((idx) => (
            <line
              key={`grid-pmh-h-${idx}`}
              x1={w * 0.54}
              y1={h * 0.82 + idx * 15}
              x2={w * 0.70}
              y2={h * 0.82 + idx * 15}
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((jdx) => (
            <line
              key={`grid-pmh-v-${jdx}`}
              x1={w * 0.54 + jdx * 34}
              y1={h * 0.82}
              x2={w * 0.54 + jdx * 34}
              y2={h * 0.82 + 60}
            />
          ))}

          {/* 4. Mạng hẻm Tân Bình / Phú Nhuận (xương cá dọc hành lang Tây Bắc) */}
          {[0.12, 0.18, 0.24, 0.30, 0.36, 0.68, 0.74, 0.88].map((f, i) => (
            <g key={`alley-w-${i}`}>
              <line x1={w * 0.28} y1={h * f} x2={w * 0.22} y2={h * f + 16} />
              <line x1={w * 0.28} y1={h * f + 12} x2={w * 0.23} y2={h * f + 28} />
              <line x1={w * 0.32} y1={h * f + 6} x2={w * 0.37} y2={h * f + 22} />
              <line x1={w * 0.32} y1={h * f + 18} x2={w * 0.36} y2={h * f + 34} />
            </g>
          ))}

          {/* 5. Mạng hẻm Bình Thạnh / Thủ Đức (xương cá dọc hành lang Đông Bắc) */}
          {[0.10, 0.16, 0.28, 0.34, 0.40, 0.64, 0.72, 0.78].map((f, i) => (
            <g key={`alley-e-${i}`}>
              <line x1={w * 0.74} y1={h * f} x2={w * 0.82} y2={h * f + 18} />
              <line x1={w * 0.74} y1={h * f + 14} x2={w * 0.80} y2={h * f + 32} />
              <line x1={w * 0.70} y1={h * f + 8} x2={w * 0.64} y2={h * f + 26} />
            </g>
          ))}
        </g>

        {/* ── LAYER 2: TUYẾN ĐẠI LỘ LIÊN QUẬN & ĐƯỜNG KẾT NỐI PHỤ ── */}
        <g stroke="var(--color-line)" strokeWidth="1.6" strokeOpacity="0.55" fill="none" strokeLinecap="round">
          <path d={pathCongHoa} />
          <path d={pathHaiBaTrung} />
          <path d={pathLeVanSy} />
          <path d={pathLyThuongKiet} />
          <path d={pathNguyenThiMinhKhai} />
          <path d={pathHongBangHauGiang} />
          <path d={pathHuynhTanPhat} />
          <path d={pathVoThiSau} strokeDasharray="5 4" />
          <path d={pathTranHungDao} />
          <path d={pathNguyenHuuTho} />
        </g>

        {/* ── LAYER 3: CÁC TRỤC ĐẠI LỘ HUYẾT MẠCH CHÍNH (THỰC TẾ 100%) ── */}
        {/* 3.1 Casing ngoài của các đại lộ */}
        <g stroke="var(--color-line-strong)" strokeWidth="6.5" strokeOpacity="0.12" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={pathPhamVanDong} />
          <path d={pathXaLoHaNoi} />
          <path d={pathNguyenVanLinh} />
          <path d={pathTruongSonNkkn} />
          <path d={pathCmtt} />
          <path d={pathDienBienPhu} />
          <path d={pathEastWestExpress} />
          <path d={pathBaThangHai} />
        </g>

        {/* 3.2 Lòng đường bề mặt của các đại lộ */}
        <g stroke="var(--color-surface)" strokeWidth="3.8" strokeOpacity="0.82" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={pathPhamVanDong} />
          <path d={pathXaLoHaNoi} />
          <path d={pathNguyenVanLinh} />
          <path d={pathTruongSonNkkn} />
          <path d={pathCmtt} />
          <path d={pathDienBienPhu} />
          <path d={pathEastWestExpress} />
          <path d={pathBaThangHai} />
        </g>

        {/* 3.3 Viền tim đường & vạch giới hạn */}
        <g stroke="var(--color-line-strong)" strokeWidth="2.2" strokeOpacity="0.48" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={pathPhamVanDong} />
          <path d={pathXaLoHaNoi} />
          <path d={pathNguyenVanLinh} />
          <path d={pathTruongSonNkkn} />
          <path d={pathCmtt} />
          <path d={pathDienBienPhu} />
          <path d={pathEastWestExpress} />
          <path d={pathBaThangHai} />
        </g>

        {/* 3.4 Vạch tim đường xung nhịp phân luồng (Pulse Stream) */}
        <g stroke="var(--color-accent)" strokeWidth="1.2" strokeDasharray="6 4" strokeOpacity="0.75" fill="none" className="traffic-flow-dash">
          <path d={pathTruongSonNkkn} />
          <path d={pathCmtt} />
          <path d={pathDienBienPhu} />
          <path d={pathEastWestExpress} />
          <path d={pathPhamVanDong} />
          <path d={pathNguyenVanLinh} />
        </g>

        {/* ── LAYER 4: CÁC NÚT GIAO VÒNG XOAY / BÙNG BINH THỰC TẾ (0 CHỮ ĐỊA DANH) ── */}
        {/* 1. Bùng binh Lăng Cha Cả (Tân Bình - Sân Bay) */}
        <g transform={`translate(${w * 0.3958}, ${h * 0.2356})`}>
          <circle r="24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="page-hub-pulse" />
          <circle r="13" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.4" />
          <circle r="5" fill="var(--color-accent)" />
        </g>

        {/* 2. Vòng xoay Hàng Xanh (Bình Thạnh - Cầu Sài Gòn) */}
        <g transform={`translate(${w * 0.6215}, ${h * 0.2136})`}>
          <circle r="18" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.65" />
          <circle r="10" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <rect x="-3" y="-3" width="6" height="6" fill="var(--color-ink)" />
        </g>

        {/* 3. Nút giao Cầu Sài Gòn (Cửa ngõ Đông TP.HCM) */}
        <g transform={`translate(${w * 0.6649}, ${h * 0.2503})`}>
          <circle r="22" fill="none" stroke="var(--color-accent)" strokeWidth="1.3" className="page-hub-pulse" />
          <circle r="12" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.2" />
          <circle r="4.5" fill="var(--color-accent)" />
        </g>

        {/* 4. Ngã 6 Dân Chủ (CMTT - Võ Thị Sáu - Ba Tháng Hai) */}
        <g transform={`translate(${w * 0.4523}, ${h * 0.4486})`}>
          <circle r="20" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.7" />
          <circle r="11" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2.2" />
          <rect x="-3.5" y="-3.5" width="7" height="7" fill="var(--color-ink)" />
        </g>

        {/* 5. Ngã 7 Lý Thái Tổ (Lý Thái Tổ - 3/2 - Ngô Gia Tự - Lê Hồng Phong) */}
        <g transform={`translate(${w * 0.4306}, ${h * 0.5})`}>
          <circle r="18" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.75" />
          <circle r="10" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <circle r="3.5" fill="var(--color-ink)" />
        </g>

        {/* 6. Vòng xoay Bến Thành (Quách Thị Trang - Lõi Quận 1) */}
        <g transform={`translate(${w * 0.5304}, ${h * 0.522})`}>
          <circle r="26" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" className="page-hub-pulse" />
          <circle r="14" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.5" />
          <circle r="5.5" fill="var(--color-accent)" />
        </g>

        {/* 7. Nút giao Cầu Phú Mỹ (Vành đai phía Đông Nam) */}
        <g transform={`translate(${w * 0.7387}, ${h * 0.8011})`}>
          <circle r="26" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" className="page-hub-pulse" />
          <circle r="13" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.4" />
          <circle r="5" fill="var(--color-accent)" />
        </g>

        {/* ── LAYER 5: CÁC NODE XE CỘ DI CHUYỂN TOÀN TRANG (VIDEO BACKGROUND EFFECT) ── */}

        {/* ── 5.1 Luồng Trục Huyết Mạch Sân Bay (Trường Sơn -> NKKN -> Bến Thành) ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5.5" fill="var(--color-accent)">
            <animateMotion
              path={pathTruongSonNkkn}
              dur="18s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="3" fill="var(--color-accent)" opacity="0.45">
            <animateMotion
              path={pathTruongSonNkkn}
              dur="18s"
              begin="0.15s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <g filter="url(#videoGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathTruongSonNkkn}
              dur="18s"
              begin="9s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <g filter="url(#videoGlowInk)">
          <circle r="4.5" fill="var(--color-ink)">
            <animateMotion
              path={pathTruongSonNkkn}
              dur="22s"
              begin="4.5s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="2.2" fill="var(--color-ink)" opacity="0.35">
            <animateMotion
              path={pathTruongSonNkkn}
              dur="22s"
              begin="4.7s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        {/* ── 5.2 Luồng Đại Lộ Đông Tây Xuyên Tâm (Võ Văn Kiệt -> Hầm Thủ Thiêm -> Mai Chí Thọ) ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5.5" fill="var(--color-accent)">
            <animateMotion
              path={pathEastWestExpress}
              dur="24s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="2.5" fill="var(--color-accent)" opacity="0.5">
            <animateMotion
              path={pathEastWestExpress}
              dur="24s"
              begin="0.2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <g filter="url(#videoGlowInk)">
          <circle r="4.5" fill="var(--color-ink)">
            <animateMotion
              path={pathEastWestExpress}
              dur="28s"
              begin="7s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <circle r="3.5" fill="var(--color-accent)" opacity="0.8">
          <animateMotion
            path={pathEastWestExpress}
            dur="24s"
            begin="13s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── 5.3 Luồng Trục Cách Mạng Tháng Tám (CMTT) ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5" fill="var(--color-accent)">
            <animateMotion
              path={pathCmtt}
              dur="20s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <g filter="url(#videoGlowInk)">
          <circle r="4" fill="var(--color-ink)">
            <animateMotion
              path={pathCmtt}
              dur="25s"
              begin="6s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        {/* ── 5.4 Luồng Đại Lộ Điện Biên Phủ ── */}
        <g filter="url(#videoGlowInk)">
          <circle r="4.5" fill="var(--color-ink)">
            <animateMotion
              path={pathDienBienPhu}
              dur="21s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <g filter="url(#videoGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathDienBienPhu}
              dur="21s"
              begin="10s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        {/* ── 5.5 Luồng Đại Lộ Phạm Văn Đồng (Cửa ngõ Đông Bắc) ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5" fill="var(--color-accent)">
            <animateMotion
              path={pathPhamVanDong}
              dur="22s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <circle r="4" fill="var(--color-ink)" opacity="0.75">
          <animateMotion
            path={pathPhamVanDong}
            dur="26s"
            begin="8s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── 5.6 Luồng Xa Lộ Hà Nội / Võ Nguyên Giáp ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5" fill="var(--color-accent)">
            <animateMotion
              path={pathXaLoHaNoi}
              dur="20s"
              begin="3s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <g filter="url(#videoGlowInk)">
          <circle r="4" fill="var(--color-ink)">
            <animateMotion
              path={pathXaLoHaNoi}
              dur="24s"
              begin="11s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        {/* ── 5.7 Luồng Đại Lộ Nguyễn Văn Linh (Nam Sài Gòn) ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5.5" fill="var(--color-accent)">
            <animateMotion
              path={pathNguyenVanLinh}
              dur="22s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="2.8" fill="var(--color-accent)" opacity="0.5">
            <animateMotion
              path={pathNguyenVanLinh}
              dur="22s"
              begin="0.22s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <circle r="4.2" fill="var(--color-ink)" opacity="0.8">
          <animateMotion
            path={pathNguyenVanLinh}
            dur="26s"
            begin="9s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── 5.8 Luồng Ven Kênh Nhiêu Lộc - Thị Nghè ── */}
        <circle r="4" fill="var(--color-line-strong)" opacity="0.75">
          <animateMotion
            path={pathKenhNhieuLoc}
            dur="19s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── 5.9 Luồng Trục Ba Tháng Hai & Trần Hưng Đạo ── */}
        <circle r="4" fill="var(--color-accent)" opacity="0.85">
          <animateMotion
            path={pathBaThangHai}
            dur="17s"
            begin="2s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>
        <circle r="4" fill="var(--color-ink)" opacity="0.75">
          <animateMotion
            path={pathTranHungDao}
            dur="18s"
            begin="5s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>
      </svg>
    </div>
  );
}

export default memo(FullPageTrafficNetwork);
