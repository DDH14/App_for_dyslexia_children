/* DỮ LIỆU MẪU */
window.CARDS = [
  { id:"w_0001", text:"bé", tags:["basic"] },
  { id:"w_0002", text:"mẹ", tags:["basic"] },
  { id:"w_0003", text:"cá", tags:["basic","tone"] },
  { id:"w_0004", text:"cháo", tags:["chtr","tone"] },
  { id:"w_0005", text:"xanh", tags:["sx"] },
  { id:"w_0006", text:"sách", tags:["sx","tone"] },
  { id:"w_0007", text:"tranh", tags:["chtr"] },
  { id:"w_0008", text:"nhà", tags:["basic"] },
  { id:"w_0009", text:"chó", tags:["chtr","tone"] },
  { id:"w_0010", text:"ráo", tags:["tone"] }
];

window.PA_ITEMS = [
  { type:"segment", target:"tranh", parts:["tr","anh"], speak:"tranh", tags:["chtr"] },
  { type:"segment", target:"sách", parts:["s","ách"], speak:"sách", tags:["sx","tone"] },
  { type:"segment", target:"cháo", parts:["ch","áo"], speak:"cháo", tags:["chtr","tone"] },
  { type:"segment", target:"xanh", parts:["x","anh"], speak:"xanh", tags:["sx"] },
  { type:"tone", base:"ma", options:["ma","má","mà","mả","mã","mạ"], correct:"má", tags:["tone"] },
  { type:"tone", base:"ba", options:["ba","bá","bà","bả","bã","bạ"], correct:"bà", tags:["tone"] },
  { type:"pair", pair:["sông","xông"], correctIndex:0, focus:"sx" },
  { type:"pair", pair:["chanh","tranh"], correctIndex:1, focus:"chtr" }
];

window.PASSAGES = [
  { id:"p_001", level:1, text:"Bé ăn cá. Mẹ mua rau. Chó chạy nhanh.",
    questions:[
      { q:"Ai ăn cá?", choices:["Bé","Mẹ","Chó"], ans:0, type:"literal" },
      { q:"Ai chạy nhanh?", choices:["Cá","Chó","Mẹ"], ans:1, type:"literal" }
    ]},
  { id:"p_002", level:2, text:"Buổi sáng, Lan tưới cây trước sân. Cây nhỏ có lá xanh. Mẹ bảo Lan tưới nhẹ để đất không trôi.",
    questions:[
      { q:"Lan làm gì buổi sáng?", choices:["Tưới cây","Quét nhà","Cho mèo ăn"], ans:0, type:"literal" },
      { q:"Vì sao tưới nhẹ?", choices:["Để đất không trôi","Vì trời mưa","Vì cây lớn"], ans:0, type:"inferential" }
    ]},
  { id:"p_003", level:3, text:"Hôm nay lớp Lan trồng rau ở vườn trường. Mỗi bạn chăm một luống. Lan nhổ cỏ, bạn Nam tưới nước. Các em học cách đo khoảng cách để gieo hạt đều. Cuối buổi, thầy khen cả lớp làm tốt.",
    questions:[
      { q:"Bạn Nam làm gì?", choices:["Tưới nước","Nhổ cỏ","Gieo hạt"], ans:0, type:"literal" },
      { q:"Vì sao phải đo khoảng cách?", choices:["Để gieo đều","Cho nhanh","Vì thầy bảo"], ans:0, type:"inferential" }
    ]}
];