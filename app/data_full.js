const CARDS = [
  // Cấp nền tảng – tần suất cao
  { id:"w_0001", text:"bé", tags:["basic"] },
  { id:"w_0002", text:"mẹ", tags:["basic"] },
  { id:"w_0003", text:"bà", tags:["basic","tone"] },
  { id:"w_0004", text:"bố", tags:["basic","tone"] },
  { id:"w_0005", text:"ông", tags:["basic","tone"] },
  { id:"w_0006", text:"cô", tags:["basic","tone"] },
  { id:"w_0007", text:"chú", tags:["basic","tone"] },
  { id:"w_0008", text:"nhà", tags:["basic"] },
  { id:"w_0009", text:"cửa", tags:["basic","tone"] },
  { id:"w_0010", text:"bàn", tags:["basic","tone"] },
  { id:"w_0011", text:"ghế", tags:["basic","tone","ghg"] },
  { id:"w_0012", text:"cây", tags:["basic","tone"] },
  { id:"w_0013", text:"lá", tags:["basic","tone"] },
  { id:"w_0014", text:"hoa", tags:["basic"] },
  { id:"w_0015", text:"quả", tags:["tone","ckqu"] },
  // Con vật – đồ vật quen thuộc
  { id:"w_0016", text:"cá", tags:["basic","tone"] },
  { id:"w_0017", text:"gà", tags:["basic","tone"] },
  { id:"w_0018", text:"chó", tags:["chtr","tone"] },
  { id:"w_0019", text:"mèo", tags:["basic","tone"] },
  { id:"w_0020", text:"chim", tags:["basic"] },
  { id:"w_0021", text:"trứng", tags:["chtr","tone"] },
  { id:"w_0022", text:"sách", tags:["sx","tone"] },
  { id:"w_0023", text:"bút", tags:["basic"] },
  { id:"w_0024", text:"vở", tags:["tone"] },
  { id:"w_0025", text:"thước", tags:["tone"] },
  // Thiên nhiên – thời tiết
  { id:"w_0026", text:"trăng", tags:["chtr"] },
  { id:"w_0027", text:"sao", tags:["basic"] },
  { id:"w_0028", text:"mưa", tags:["tone"] },
  { id:"w_0029", text:"nắng", tags:["tone"] },
  { id:"w_0030", text:"mây", tags:["tone"] },
  { id:"w_0031", text:"gió", tags:["tone"] },
  { id:"w_0032", text:"sông", tags:["sx"] },
  { id:"w_0033", text:"xương", tags:["sx"] },
  { id:"w_0034", text:"biển", tags:["tone"] },
  { id:"w_0035", text:"núi", tags:["tone"] },
  { id:"w_0036", text:"đường", tags:["tone"] },
  // Hoạt động hằng ngày
  { id:"w_0037", text:"đi", tags:["basic"] },
  { id:"w_0038", text:"về", tags:["tone"] },
  { id:"w_0039", text:"học", tags:["basic"] },
  { id:"w_0040", text:"đọc", tags:["basic"] },
  { id:"w_0041", text:"viết", tags:["tone"] },
  { id:"w_0042", text:"chơi", tags:["tone"] },
  { id:"w_0043", text:"chạy", tags:["tone"] },
  { id:"w_0044", text:"nhảy", tags:["tone"] },
  { id:"w_0045", text:"ăn", tags:["tone"] },
  { id:"w_0046", text:"uống", tags:["tone"] },
  { id:"w_0047", text:"ngủ", tags:["tone"] },
  { id:"w_0048", text:"thức", tags:["tone"] },
  // Cụm dễ nhầm quy tắc chính tả
  { id:"w_0049", text:"chanh", tags:["chtr"] },
  { id:"w_0050", text:"tranh", tags:["chtr"] },
  { id:"w_0051", text:"sương", tags:["sx"] },
  { id:"w_0052", text:"xưa", tags:["sx","tone"] },
  { id:"w_0053", text:"quà", tags:["ckqu","tone"] },
  { id:"w_0054", text:"quê", tags:["ckqu","tone"] },
  { id:"w_0055", text:"kẹo", tags:["ckqu","tone"] },
  { id:"w_0056", text:"cối", tags:["tone"] },
  { id:"w_0057", text:"nghỉ", tags:["ngngh","tone"] },
  { id:"w_0058", text:"nghệ", tags:["ngngh","tone"] },
  { id:"w_0059", text:"nồi", tags:["nl","tone"] },
  { id:"w_0060", text:"lồi", tags:["nl","tone"] },
  { id:"w_0061", text:"trâu", tags:["chtr","tone"] },
  { id:"w_0062", text:"châu", tags:["chtr","tone"] },
  { id:"w_0063", text:"giấy", tags:["tone"] },
  { id:"w_0064", text:"khỏe", tags:["tone"] },
  { id:"w_0065", text:"bữa", tags:["tone"] }
];

const PA_ITEMS = [
  // Ghép âm/tiếng (onset–rime, cụm phụ âm)
  { type:"segment", target:"tranh", parts:["tr","anh"], speak:"tranh", tags:["chtr"] },
  { type:"segment", target:"sách", parts:["s","ách"], speak:"sách", tags:["sx","tone"] },
  { type:"segment", target:"cháo", parts:["ch","áo"], speak:"cháo", tags:["chtr","tone"] },
  { type:"segment", target:"xanh", parts:["x","anh"], speak:"xanh", tags:["sx"] },
  { type:"segment", target:"trường", parts:["tr","ường"], speak:"trường", tags:["chtr"] },
  { type:"segment", target:"nghỉ", parts:["ngh","ỉ"], speak:"nghỉ", tags:["ngngh","tone"] },
  { type:"segment", target:"ghế", parts:["gh","ế"], speak:"ghế", tags:["ghg","tone"] },
  { type:"segment", target:"quả", parts:["qu","ả"], speak:"quả", tags:["ckqu","tone"] },
  { type:"segment", target:"thuốc", parts:["thu","ốc"], speak:"thuốc", tags:["tone"] },
  { type:"segment", target:"viết", parts:["vi","ết"], speak:"viết", tags:["tone"] },
  { type:"segment", target:"bắp", parts:["b","ắp"], speak:"bắp", tags:["tone"] },
  { type:"segment", target:"chạy", parts:["ch","ạy"], speak:"chạy", tags:["tone"] },
  { type:"segment", target:"sữa", parts:["s","ữa"], speak:"sữa", tags:["tone"] },
  { type:"segment", target:"cầu", parts:["c","ầu"], speak:"cầu", tags:["tone"] },
  { type:"segment", target:"giấy", parts:["gi","ấy"], speak:"giấy", tags:["tone"] },
  { type:"segment", target:"người", parts:["ng","ười"], speak:"người", tags:[] },
  { type:"segment", target:"trẻ", parts:["tr","ẻ"], speak:"trẻ", tags:["chtr","tone"] },
  { type:"segment", target:"khỏe", parts:["kh","ỏe"], speak:"khỏe", tags:["tone"] },
  { type:"segment", target:"bánh", parts:["b","ánh"], speak:"bánh", tags:["tone"] },
  { type:"segment", target:"ngỗng", parts:["ng","ỗng"], speak:"ngỗng", tags:["tone"] },

  // Thanh điệu (6 thanh) – chọn đúng
  { type:"tone", base:"me", options:["me","mé","mè","mẻ","mẽ","mẹ"], correct:"mẹ", tags:["tone"] },
  { type:"tone", base:"ga", options:["ga","gá","gà","gả","gã","gạ"], correct:"gà", tags:["tone"] },
  { type:"tone", base:"cho", options:["cho","chó","chò","chỏ","chõ","chọ"], correct:"chó", tags:["tone","chtr"] },
  { type:"tone", base:"la", options:["la","lá","là","lả","lã","lạ"], correct:"lá", tags:["tone"] },
  { type:"tone", base:"ca", options:["ca","cá","cà","cả","cã","cạ"], correct:"cá", tags:["tone"] },
  { type:"tone", base:"gio", options:["gio","gió","gò","gỏ","gõ","gọ"], correct:"gió", tags:["tone"] },
  { type:"tone", base:"lua", options:["lua","lúa","lùa","lủa","lũa","lụa"], correct:"lúa", tags:["tone"] },
  { type:"tone", base:"dua", options:["dua","dúa","dùa","dủa","dũa","dứa"], correct:"dứa", tags:["tone"] },
  { type:"tone", base:"que", options:["que","qué","què","quẻ","quẽ","què"], correct:"quê", tags:["tone","ckqu"] },
  { type:"tone", base:"na", options:["na","ná","nà","nả","nã","nạ"], correct:"ná", tags:["tone"] },

  // Cặp tối thiểu (nghe – chọn)
  { type:"pair", pair:["sương","xương"], correctIndex:0, focus:"sx" },
  { type:"pair", pair:["sấu","xấu"], correctIndex:1, focus:"sx" },
  { type:"pair", pair:["sôi","xôi"], correctIndex:1, focus:"sx" },
  { type:"pair", pair:["trâu","châu"], correctIndex:0, focus:"chtr" },
  { type:"pair", pair:["chanh","tranh"], correctIndex:1, focus:"chtr" },
  { type:"pair", pair:["chai","trai"], correctIndex:1, focus:"chtr" },
  { type:"pair", pair:["nồi","lồi"], correctIndex:0, focus:"nl" },
  { type:"pair", pair:["nặng","lặng"], correctIndex:0, focus:"nl" }
];

const PASSAGES = [
  // Level 1 — câu ngắn, từ tần suất cao
  {
    id:"p_001", level:1,
    text:"Bé ăn cá. Mẹ mua rau. Chó chạy nhanh.",
    questions:[
      { q:"Ai ăn cá?", choices:["Bé","Mẹ","Chó"], ans:0, type:"literal" },
      { q:"Ai chạy nhanh?", choices:["Cá","Chó","Mẹ"], ans:1, type:"literal" }
    ]
  },
  {
    id:"p_004", level:1,
    text:"Bé Na tưới cây. Lá ướt. Na cười vui.",
    questions:[
      { q:"Na làm gì?", choices:["Tưới cây","Quét nhà","Cho cá ăn"], ans:0, type:"literal" },
      { q:"Vì sao lá ướt?", choices:["Vì tưới nước","Vì gió","Vì nắng"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_005", level:1,
    text:"Bố bế bé. Mẹ phơi áo. Chó nằm ngủ.",
    questions:[
      { q:"Ai phơi áo?", choices:["Bố","Mẹ","Bé"], ans:1, type:"literal" },
      { q:"Chó làm gì?", choices:["Ngủ","Ăn","Chạy"], ans:0, type:"literal" }
    ]
  },

  // Level 2 — 2–3 câu, mở rộng hành động – nguyên nhân
  {
    id:"p_002", level:2,
    text:"Buổi sáng, Lan tưới cây trước sân. Cây nhỏ có lá xanh. Mẹ bảo Lan tưới nhẹ để đất không trôi.",
    questions:[
      { q:"Lan làm gì buổi sáng?", choices:["Tưới cây","Quét nhà","Cho mèo ăn"], ans:0, type:"literal" },
      { q:"Vì sao tưới nhẹ?", choices:["Để đất không trôi","Vì trời mưa","Vì cây lớn"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_006", level:2,
    text:"Chiều nay, Minh cùng mẹ ra chợ. Minh chọn bó rau tươi và ít cà chua. Trời nắng nhẹ nên hai mẹ con đi chậm để đỡ mệt.",
    questions:[
      { q:"Minh đi đâu?", choices:["Ra chợ","Ra bờ sông","Đến trường"], ans:0, type:"literal" },
      { q:"Vì sao hai mẹ con đi chậm?", choices:["Vì trời nắng","Vì mưa","Vì đói"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_007", level:2,
    text:"Ở lớp, cô giao việc tưới vườn cây. Mỗi bạn cầm một bình nhỏ. Bạn nào tưới xong sẽ xếp bình ngay ngắn vào kệ.",
    questions:[
      { q:"Cô giao việc gì?", choices:["Tưới vườn cây","Quét lớp","Lau bảng"], ans:0, type:"literal" },
      { q:"Bình được đặt ở đâu sau khi tưới?", choices:["Ở kệ","Ngoài sân","Trên bàn"], ans:0, type:"literal" }
    ]
  },

  // Level 3 — 4–5 câu, thêm trình tự – mục tiêu
  {
    id:"p_003", level:3,
    text:"Hôm nay lớp Lan trồng rau ở vườn trường. Mỗi bạn chăm một luống. Lan nhổ cỏ, bạn Nam tưới nước. Các em học cách đo khoảng cách để gieo hạt đều. Cuối buổi, thầy khen cả lớp làm tốt.",
    questions:[
      { q:"Bạn Nam làm gì?", choices:["Tưới nước","Nhổ cỏ","Gieo hạt"], ans:0, type:"literal" },
      { q:"Vì sao phải đo khoảng cách?", choices:["Để gieo đều","Cho nhanh","Vì thầy bảo"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_008", level:3,
    text:"Sáng chủ nhật, bố dẫn Minh đi công viên. Hai bố con tập đi xe đạp quanh hồ. Minh tập giữ thăng bằng và nhìn thẳng phía trước. Ngã một lần, Minh vẫn đứng dậy tập tiếp.",
    questions:[
      { q:"Minh đi đâu với bố?", choices:["Công viên","Siêu thị","Sân trường"], ans:0, type:"literal" },
      { q:"Minh học được điều gì khi đi xe?", choices:["Giữ thăng bằng","Đi thật nhanh","Không cần đội mũ"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_009", level:3,
    text:"Trong giờ thủ công, cả nhóm làm diều giấy. Bạn cắt, bạn dán, bạn buộc dây. Gió lên, chiếc diều nhỏ bay cao. Các bạn reo vui vì thành quả của mình.",
    questions:[
      { q:"Cả nhóm làm gì?", choices:["Làm diều","Nấu ăn","Trồng hoa"], ans:0, type:"literal" },
      { q:"Vì sao các bạn reo vui?", choices:["Vì diều bay lên","Vì trời mưa","Vì được nghỉ học"], ans:0, type:"inferential" }
    ]
  },

  // Level 4 — 80–120 từ, thêm nguyên nhân – kết quả – suy luận
  {
    id:"p_010", level:4,
    text:"Buổi chiều, lớp 3A tổ chức phiên chợ xanh ở sân trường. Bạn Lan bày rổ rau do lớp tự trồng, có rau muống, cải xanh và ít rau thơm. Bạn Nam phụ cân rau và ghi giá. Mỗi người chỉ mang theo túi vải để đựng, không dùng túi nilon. Hết giờ, các bạn dọn sạch sân, gom rác vào đúng nơi. Cô giáo khen lớp biết giữ môi trường và biết chia việc cho nhau.",
    questions:[
      { q:"Phiên chợ bán gì?", choices:["Rau tự trồng","Đồ chơi","Sách cũ"], ans:0, type:"literal" },
      { q:"Vì sao mọi người dùng túi vải?", choices:["Để giảm rác","Để đẹp hơn","Vì rẻ"], ans:0, type:"inferential" },
      { q:"Sau khi kết thúc, lớp làm gì?", choices:["Dọn sạch sân","Về ngay","Chơi đá bóng"], ans:0, type:"literal" }
    ]
  },
  {
    id:"p_011", level:4,
    text:"Tổ của Mai làm dự án quan sát thời tiết một tuần. Mỗi ngày, các bạn ghi nhiệt độ, lượng mưa và hướng gió. Cuối tuần, cả tổ vẽ biểu đồ đơn giản để so sánh. Mai nhận ra hai ngày mưa thì nhiệt độ thấp hơn. Cô gợi ý tổ suy nghĩ thêm: ngoài mưa, còn yếu tố nào có thể làm trời mát?",
    questions:[
      { q:"Tổ của Mai ghi những gì mỗi ngày?", choices:["Nhiệt độ, mưa, gió","Bài tập","Giờ vào lớp"], ans:0, type:"literal" },
      { q:"Mai rút ra điều gì?", choices:["Ngày mưa mát hơn","Ngày nắng mát hơn","Ngày gió nóng hơn"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_012", level:4,
    text:"Câu lạc bộ đọc sách chọn chủ đề động vật. Mỗi bạn giới thiệu một cuốn mình thích và đọc to một đoạn ngắn. Bạn Bình luyện đọc trước ở nhà để không ngắt quãng. Lúc đầu bạn hơi run nhưng sau vài câu thì bình tĩnh hơn. Cả nhóm góp ý cách lên giọng ở câu hỏi và cách ngắt ở dấu phẩy.",
    questions:[
      { q:"Chủ đề buổi đọc là gì?", choices:["Động vật","Cây cối","Nghề nghiệp"], ans:0, type:"literal" },
      { q:"Bạn Bình chuẩn bị như thế nào?", choices:["Luyện đọc trước","Không chuẩn bị","Chỉ nghe bạn khác"], ans:0, type:"literal" },
      { q:"Góp ý của nhóm tập trung vào điều gì?", choices:["Ngắt giọng và lên giọng","Viết tả","Vẽ tranh"], ans:0, type:"inferential" }
    ]
  },

  // Level 5 — 120–180 từ, nội dung dài hơn, cần suy luận
  {
    id:"p_013", level:5,
    text:"Trước ngày hội khoa học, nhóm của Linh thử nghiệm mô hình lọc nước mini. Các bạn dùng cát, sỏi, than hoạt tính và bông để làm lớp lọc. Nước đục sau khi chảy qua mô hình thì trong hơn, nhưng vẫn còn màu vàng nhạt. Linh đề nghị thử thay đổi thứ tự các lớp và rửa sạch vật liệu trước khi lắp lại. Lần hai, nước trong hơn rõ rệt. Dù vậy, cô giáo nhắc rằng nước này chỉ dùng minh hoạ nguyên lí và không đủ an toàn để uống. Nhóm ghi chép cẩn thận, chuẩn bị bảng giải thích dễ hiểu cho khách tham quan.",
    questions:[
      { q:"Nhóm dùng gì để làm lớp lọc?", choices:["Cát, sỏi, than, bông","Giấy, gỗ","Đất sét"], ans:0, type:"literal" },
      { q:"Vì sao lần hai nước trong hơn?", choices:["Thay thứ tự và rửa vật liệu","Thêm màu","Đun sôi nước"], ans:0, type:"inferential" },
      { q:"Nước sau khi lọc có uống được không?", choices:["Không, chỉ minh hoạ","Có thể uống","Tùy thời tiết"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_014", level:5,
    text:"Đội bóng rổ của trường tập chiến thuật mới. Huấn luyện viên cho cả đội xem lại video trận trước để nhận ra lúc nào đội bạn phản công nhanh. Sau đó, từng nhóm nhỏ tập kèm người và hỗ trợ bọc lót. Cuối buổi, mọi người cùng tự đánh giá: ai giữ nhịp tốt, ai cần tập thêm động tác bật nhảy. Kế hoạch tuần tới là tăng sức bền và phối hợp khi chuyển trạng thái tấn công – phòng thủ.",
    questions:[
      { q:"Cả đội xem lại gì để rút kinh nghiệm?", choices:["Video trận trước","Sách chiến thuật","Ảnh đội bạn"], ans:0, type:"literal" },
      { q:"Mục tiêu tuần tới là gì?", choices:["Tăng sức bền và phối hợp","Chạy đường dài","Chỉ tập ném rổ"], ans:0, type:"inferential" }
    ]
  },
  {
    id:"p_015", level:5,
    text:"Câu lạc bộ môi trường mở buổi giới thiệu về phân loại rác. Các bạn minh hoạ bằng ba thùng màu: xanh cho rác tái chế, nâu cho rác hữu cơ, xám cho rác còn lại. Một nhóm đóng vai người dân, nhóm khác đóng vai hướng dẫn viên để thực hành tình huống. Cuối giờ, câu hỏi đặt ra là: nếu không chắc một món đồ có tái chế được hay không, nên làm gì để giảm sai sót? Nhiều bạn đề xuất tra cứu nhanh trên điện thoại và dán nhãn hướng dẫn ở góc lớp.",
    questions:[
      { q:"Có mấy thùng rác và màu gì?", choices:["Ba thùng: xanh, nâu, xám","Hai thùng: xanh, đỏ","Một thùng: vàng"], ans:0, type:"literal" },
      { q:"Nếu không chắc món đồ có tái chế được, nên làm gì?", choices:["Tra cứu và dán nhãn","Vứt đại","Để ở nhà"], ans:0, type:"inferential" }
    ]
  }
];