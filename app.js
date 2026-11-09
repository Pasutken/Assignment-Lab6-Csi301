import { BrowserProvider, Contract, formatEther, getAddress, Interface, parseEther } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/dist/ethers.min.js";
import { bankAbi, bankAddress, student } from "./config.js";

const SEPOLIA = "0xaa36a7";
const EXPLORER = "https://sepolia.etherscan.io";
const ADDRESS_KEY = "csi301-sepolia-bank-address";
const $ = (id) => document.getElementById(id);

let wallet;
let active;
let busy = false;
let walletChanged = false;
let configuredAddress = bankAddress.trim();
try {
  configuredAddress ||= localStorage.getItem(ADDRESS_KEY) ?? "";
} catch {
  // The page still works when the browser blocks storage.
}

$("student-id").textContent = student.id || "รอกรอกข้อมูล";
$("student-name").textContent = student.name || "รอกรอกข้อมูล";
$("contract-address").value = configuredAddress;
updateExplorer();

window.addEventListener("eip6963:announceProvider", ({ detail }) => {
  if (detail?.info?.rdns === "io.metamask") bindWallet(detail.provider);
});
window.dispatchEvent(new Event("eip6963:requestProvider"));

function bindWallet(provider) {
  if (wallet || !provider?.request) return;
  wallet = provider;
  wallet.on?.("accountsChanged", onWalletChange);
  wallet.on?.("chainChanged", onWalletChange);
  wallet.on?.("disconnect", onWalletChange);
}

function onWalletChange() {
  active = undefined;
  $("balance").textContent = "—";
  $("account").textContent = "กำลังตรวจสอบบัญชี";
  walletChanged = true;
  renderControls();
  if (!busy) void run(sync);
}

function renderControls() {
  $("connect").disabled = busy || Boolean(active);
  $("connect").textContent = active ? "เชื่อม MetaMask แล้ว" : "เชื่อม MetaMask";
  for (const id of ["refresh", "deposit", "withdraw"]) $(id).disabled = busy || !active;
  $("contract-address").disabled = busy;
  $("save-address").disabled = busy;
}

function status(text, tone = "info") {
  $("status").textContent = text;
  $("status").parentElement.dataset.tone = tone;
}

function updateExplorer() {
  const link = $("explorer");
  try {
    link.href = `${EXPLORER}/address/${getAddress(configuredAddress)}#code`;
    link.hidden = false;
  } catch {
    link.removeAttribute("href");
    link.hidden = true;
  }
}

function showTransaction(hash) {
  const link = $("transaction");
  link.hidden = !hash;
  if (hash) link.href = `${EXPLORER}/tx/${hash}`;
  else link.removeAttribute("href");
}

function errorMessage(error) {
  if (error.code === 4001 || error.code === "ACTION_REJECTED") return "ยกเลิกรายการใน MetaMask แล้ว";
  if (error.code === -32002) return "มีหน้าต่าง MetaMask รอให้ยืนยันอยู่";
  if (error.code === "INSUFFICIENT_FUNDS") return "Sepolia ETH ใน MetaMask ไม่พอสำหรับยอดที่ส่งและค่า Gas";
  if (error.code === "BAD_DATA" || error.code === "CALL_EXCEPTION") {
    return error.reason || "เรียกสัญญาไม่สำเร็จ ตรวจสอบ Contract Address, ABI และยอดเงิน";
  }
  return error.shortMessage || error.message || "ดำเนินการไม่สำเร็จ";
}

async function run(action) {
  if (busy) return;
  busy = true;
  renderControls();
  try {
    await action();
  } catch (error) {
    status(errorMessage(error), "error");
  } finally {
    busy = false;
    renderControls();
    if (walletChanged) void run(sync);
  }
}

async function sync() {
  walletChanged = false;
  active = undefined;
  $("balance").textContent = "—";
  $("account").textContent = "ยังไม่เชื่อมต่อ";
  const accounts = await wallet?.request({ method: "eth_accounts" });
  if (!accounts?.length) return status("เชื่อม MetaMask เพื่อเริ่มใช้งาน");

  const account = getAddress(accounts[0]);
  $("account").textContent = account;
  const chain = await wallet.request({ method: "eth_chainId" });
  if (chain !== SEPOLIA) return status("กดเชื่อม MetaMask เพื่อสลับไป Sepolia Testnet", "error");
  if (!configuredAddress) {
    document.querySelector(".settings").open = true;
    return status("เชื่อม MetaMask แล้ว กรุณาตั้งค่า Contract Address ของ Bank บน Sepolia");
  }

  const address = getAddress(configuredAddress);
  const provider = new BrowserProvider(wallet);
  if (await provider.getCode(address) === "0x") throw new Error("ไม่พบสัญญาที่ Contract Address นี้บน Sepolia");
  const abi = new Interface(bankAbi);
  for (const signature of ["deposit()", "withdraw(uint256)", "checkBlance()"]) {
    if (!abi.hasFunction(signature)) throw new Error(`ABI ไม่มีฟังก์ชัน ${signature}`);
  }
  const signer = await provider.getSigner(account);
  const contract = new Contract(address, abi, signer);
  const balance = await contract.checkBlance();
  if (walletChanged) return;
  active = { account, contract };
  $("balance").textContent = formatEther(balance);
  status("เชื่อม MetaMask และสัญญาธนาคารแล้ว");
}

async function connect() {
  if (!wallet) {
    const injected = window.ethereum;
    bindWallet(injected?.providers?.find((provider) => provider.isMetaMask) ?? (injected?.isMetaMask ? injected : undefined));
  }
  if (!wallet) throw new Error("เปิดเว็บนี้ในเบราว์เซอร์ที่ติดตั้ง MetaMask");
  status("รอการเชื่อมต่อจาก MetaMask");
  await wallet.request({ method: "eth_requestAccounts" });
  if (await wallet.request({ method: "eth_chainId" }) !== SEPOLIA) {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA }] });
  }
  await sync();
}

async function checkBalance() {
  const current = active;
  const balance = await current.contract.checkBlance();
  if (current === active) {
    $("balance").textContent = formatEther(balance);
    status("อัปเดตยอดเงินแล้ว");
  }
}

function readAmount() {
  const value = $("amount").value.trim();
  if (!/^(?:\d+(?:\.\d{1,18})?|\.\d{1,18})$/.test(value)) {
    throw new Error("กรอกจำนวน ETH เป็นตัวเลข ทศนิยมได้สูงสุด 18 ตำแหน่ง");
  }
  const amount = parseEther(value);
  if (amount <= 0n) throw new Error("จำนวนเงินต้องมากกว่า 0 ETH");
  return amount;
}

async function transfer(isDeposit) {
  const current = active;
  showTransaction();
  const amount = readAmount();
  const chain = await wallet.request({ method: "eth_chainId" });
  const [account] = await wallet.request({ method: "eth_accounts" });
  if (current !== active || chain !== SEPOLIA || account?.toLowerCase() !== current.account.toLowerCase()) {
    throw new Error("บัญชีหรือเครือข่ายเปลี่ยน กรุณาตรวจสอบ MetaMask แล้วลองอีกครั้ง");
  }

  status("ตรวจสอบรายการแล้วกดยืนยันใน MetaMask");
  const tx = isDeposit ? await current.contract.deposit({ value: amount }) : await current.contract.withdraw(amount);
  showTransaction(tx.hash);
  status("ส่งธุรกรรมแล้ว กำลังรอผลบน Sepolia");
  try {
    await tx.wait(1, 120000);
  } catch (error) {
    if (error.code === "TRANSACTION_REPLACED") {
      showTransaction(error.replacement.hash);
      if (error.cancelled || error.receipt?.status !== 1) throw new Error("ธุรกรรมถูกยกเลิกหรือแทนที่");
    } else if (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR") {
      return status("ส่งธุรกรรมแล้ว ตรวจสอบผลได้จากลิงก์ Etherscan ด้านล่าง");
    } else {
      throw error;
    }
  }

  $("amount").value = "";
  const action = isDeposit ? "ฝากเงิน" : "ถอนเงิน";
  if (current === active) {
    try {
      const balance = await current.contract.checkBlance();
      if (current === active) $("balance").textContent = formatEther(balance);
    } catch {
      return status(`${action}สำเร็จ กดตรวจสอบยอดเพื่ออัปเดตยอดเงิน`);
    }
  }
  status(`${action}สำเร็จ`);
}

$("connect").addEventListener("click", () => void run(connect));
$("refresh").addEventListener("click", () => void run(checkBalance));
$("deposit").addEventListener("click", () => void run(() => transfer(true)));
$("withdraw").addEventListener("click", () => void run(() => transfer(false)));
$("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  void run(async () => {
    const entered = $("contract-address").value.trim();
    if (!/^0x[0-9a-f]{40}$/i.test(entered)) throw new Error("กรอก Contract Address รูปแบบ 0x ตามด้วยเลขฐานสิบหก 40 ตัว");
    configuredAddress = getAddress(entered);
    $("contract-address").value = configuredAddress;
    try {
      localStorage.setItem(ADDRESS_KEY, configuredAddress);
    } catch {
      // The address remains active for this page session.
    }
    updateExplorer();
    showTransaction();
    await sync();
  });
});
