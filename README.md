# Sepolia Bank · CSI301

เว็บ DApp สำหรับฝาก ถอน และตรวจยอดเงินฝากของแต่ละบัญชี MetaMask บน Sepolia Testnet

สัญญา [`0x2565f98cc76ab6810bf24a2b68fe8cec97301406`](https://sepolia.etherscan.io/address/0x2565f98cc76ab6810bf24a2b68fe8cec97301406#code) Deploy และ Verify แบบ Exact Match แล้ว `config.js` มี Address, ABI จาก Etherscan และข้อมูลนักศึกษาที่จะแสดงในหน้าเว็บ ดูผลการ Deploy ได้จาก [ธุรกรรมบน Sepolia Etherscan](https://sepolia.etherscan.io/tx/0xc92cf5da7ed8b4fdf8fea75ca2d7d06749940ab7ff0ae03c876162bfd9b873de)

## 1. Compile และ Deploy ใน Remix (สำหรับ Deploy ใหม่)

1. เปิด [Remix IDE](https://app.remix.live/) และนำ `Bank.sol` เข้า File Explorer
2. เปิด Solidity Compiler เลือก `0.8.26+commit.8a97fa7a` ปิด Optimization และใช้ EVM Version แบบ Default แล้วกด **Compile Bank.sol**
3. เปิด **Deploy & Run Transactions → Environment → Browser Extension → Sepolia Testnet - MetaMask** เลือกบัญชีที่มี Sepolia ETH สำหรับค่า Gas
4. เลือกสัญญา **Bank** ให้ Value เป็น `0` แล้วกด **Deploy** และยืนยันใน MetaMask
5. เมื่อเห็น **Bank** ใน Deployed Contracts ให้คัดลอก **Contract Address** ที่ขึ้นต้นด้วย `0x`

สัญญาเก็บยอดตาม `msg.sender` และใช้ชื่อ `checkBlance()` ตรงกับโจทย์ ฟังก์ชันถอนตัดยอดก่อนส่ง ETH หากการส่งล้มเหลว ธุรกรรมจะย้อนกลับพร้อมยอดเดิม

## 2. Verify และคัดลอก ABI

1. ค้นหา Contract Address ที่ [Sepolia Etherscan](https://sepolia.etherscan.io/) แล้วเปิด **Contract → Verify and Publish**
2. ใช้ **Solidity (Single file)**, compiler `v0.8.26+commit.8a97fa7a`, license MIT, Optimization **No**, EVM **Default** แล้วส่งเนื้อหา `Bank.sol` ที่ใช้ Deploy จริง หากเปลี่ยนค่าคอมไพล์ใน Remix ให้ใช้ค่าเดียวกันตอน Verify
3. เมื่อหน้า **Contract → Code** แสดง **Source Code Verified** ให้คัดลอก **Contract ABI** ซึ่งเป็น JSON array
4. เปิด `config.js` ใส่ `student.id`, `student.name` และ `bankAddress` จากนั้นแทนค่า array ของ `bankAbi` ด้วย ABI ที่คัดลอกจาก Etherscan โค้ดมี ABI เริ่มต้นที่ตรงกับ `Bank.sol` อยู่แล้ว

Etherscan ใช้ดู Address, ABI และธุรกรรม ส่วนหน้าเว็บใช้ MetaMask ส่งคำสั่งไปยังสัญญาบน Sepolia ผ่าน ethers.js

## 3. เปิดหน้าเว็บและทดสอบ

เปิดโฟลเดอร์ด้วย VS Code Live Server หรือใช้ `npx --yes serve .` จากโฟลเดอร์ที่มี `index.html` แล้วเปิด URL ที่โปรแกรมแสดง หน้าเว็บใช้ JavaScript modules จึงต้องเปิดผ่าน HTTP/HTTPS

| ขั้นตอน | ตัวอย่าง | ยอดเงินฝากที่คาดหวังสำหรับบัญชีใหม่ |
| --- | --- | --- |
| เชื่อม MetaMask แล้วกดตรวจสอบยอด | บัญชี A บน Sepolia | `0.0 ETH` |
| ฝากและยืนยันใน MetaMask | `0.001 ETH` | `0.001 ETH` |
| ถอนและยืนยันใน MetaMask | `0.0004 ETH` | `0.0006 ETH` |
| ตรวจสอบยอดในอีกบัญชี | สลับเป็นบัญชี B ที่ยังไม่เคยฝาก | `0.0 ETH` |

เมื่อยังไม่ได้ใส่ `bankAddress` ใน `config.js` สามารถใส่ Address เพื่อทดสอบในหน้า **ตั้งค่าสัญญาธนาคาร** ได้ ค่าที่กรอกในหน้านี้ใช้กับเบราว์เซอร์นั้น ให้ตั้ง `bankAddress` ในไฟล์ก่อนเผยแพร่เพื่อให้ผู้ตรวจเปิดใช้งานได้ทันที

## 4. เผยแพร่บน GitHub Pages

1. อัปโหลด `index.html`, `styles.css`, `app.js` และ `config.js` ไปที่รากของ repository เดียวกันบน GitHub
2. ไปที่ **Settings → Pages → Deploy from a branch** แล้วเลือก **main → /(root) → Save**
3. เปิด URL ที่ GitHub Pages แสดง ทดสอบด้วย MetaMask และนำ URL ของหน้าเว็บไปส่งใน D-Learning
