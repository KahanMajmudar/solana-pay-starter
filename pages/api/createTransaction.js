import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
	clusterApiUrl,
	Connection,
	PublicKey,
	Transaction,
	SystemProgram,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
	createTransferCheckedInstruction,
	getAssociatedTokenAddress,
	getMint,
} from "@solana/spl-token";
import BigNumber from "bignumber.js";
import products from "./products.json";

const usdcAddress = new PublicKey(
	"Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
);
const sellerAddress = "CnSfABjPtKbnnPT8P3XtD42xCoUr4phmJyqsvPbGMjig";
const sellerPubKey = new PublicKey(sellerAddress);

const createTransaction = async (req, res) => {
	try {
		const { buyer, orderID, itemID } = req.body;

		if (!buyer) {
			res.status(400).json({
				message: "Missing buyer address",
			});
		}

		if (!orderID) {
			res.status(400).json({
				message: "Missing order ID",
			});
		}

		const itemPrice = products.find((item) => item.id === itemID).price;

		if (!itemPrice) {
			res.status(404).json({
				message: `Item not found. please check item ID: ${itemID}`,
			});
		}

		const bigAmount = BigNumber(itemPrice);
		const buyerPubKey = new PublicKey(buyer);
		const network = WalletAdapterNetwork.Devnet;
		const endpoint = clusterApiUrl(network);
		const connection = new Connection(endpoint);

		const { blockhash } = await connection.getLatestBlockhash("finalized");

		const tx = new Transaction({
			recentBlockhash: blockhash,
			feePayer: buyerPubKey,
		});

		// For SOL
		// const transferInstruction = SystemProgram.transfer({
		// 	fromPubkey: buyerPubKey,
		// 	lamports: bigAmount.multipliedBy(LAMPORTS_PER_SOL).toNumber(),
		// 	toPubkey: sellerPubKey,
		// });

		// For USDC
		const buyerUsdcAddress = await getAssociatedTokenAddress(
			usdcAddress,
			buyerPubKey
		);
		const shopUsdcAddress = await getAssociatedTokenAddress(
			usdcAddress,
			sellerPubKey
		);

		const usdcMint = await getMint(connection, usdcAddress);

		const transferInstruction = createTransferCheckedInstruction(
			buyerUsdcAddress,
			usdcAddress,
			shopUsdcAddress,
			buyerPubKey,
			bigAmount.toNumber() * 10 ** usdcMint.decimals,
			usdcMint.decimals
		);

		transferInstruction.keys.push({
			pubkey: new PublicKey(orderID),
			isSigner: false,
			isWritable: false,
		});

		tx.add(transferInstruction);

		const serializedTx = tx.serialize({ requireAllSignatures: false });
		const base64 = serializedTx.toString("base64");

		res.status(200).json({ transaction: base64 });
	} catch (error) {
		console.error(error);

		return res.status(500).json({ error: "error creating tx" });
	}
};

export default function handler(req, res) {
	if (req.method === "POST") {
		createTransaction(req, res);
	} else {
		res.status(405).end();
	}
}
