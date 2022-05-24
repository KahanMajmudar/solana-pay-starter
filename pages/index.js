import React, { useEffect, useState } from "react";
import Product from "../components/Products";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
	const { publicKey } = useWallet();
	const [products, setProducts] = useState([]);

	useEffect(() => {
		if (publicKey) {
			fetch(`/api/fetchProducts`)
				.then((response) => response.json())
				.then((data) => {
					setProducts(data);
					console.log("Products", data);
				});
		}
	}, [publicKey]);

	const renderNotConnectedContainer = () => (
		<div>
			<iframe
				allow="fullscreen"
				frameBorder="0"
				height="270"
				src="https://giphy.com/embed/jJjb9AUHOiP3nJJMdy/video"
				width="480"
			></iframe>

			<div className="button-container">
				<WalletMultiButton className="cta-button connect-wallet-button" />
			</div>
		</div>
	);

	const renderItemBuyContainer = () => (
		<div className="products-container">
			{products.map((product) => (
				<Product key={product.id} product={product} />
			))}
		</div>
	);

	return (
		<div className="App">
			<div className="container">
				<header className="header-container">
					<p className="header"> 😳 Memetics Meme Store 😈</p>
					<p className="sub-text">The only meme store that accepts sh*tcoins</p>
				</header>

				<main>
					{/* We only render the connect button if public key doesn't exist */}
					{publicKey ? renderItemBuyContainer() : renderNotConnectedContainer()}
				</main>

				<div className="footer-container">
					<img
						alt="Twitter Logo"
						className="twitter-logo"
						src="twitter-logo.svg"
					/>
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built on @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
};

export default App;
