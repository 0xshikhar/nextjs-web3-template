import styles from "../styles/InstructionsComponent.module.css";
import { Button } from "@/components/ui/button";

export default function InstructionsComponent() {
	return (
		<div className={styles.container}>
			<header className={styles.header_container}>
				<h1>
					Create<span> Nextjs14 Template Using RainbowKit, Wagmi, and TailwindCSS</span>
				</h1>
				<h3 className="text-[24px] p-4 mb-10 ">By <span>0xShikhar</span> </h3>
				<p>
					Get started by editing this page in{" "}
					<span>/pages/index.tsx</span>
				</p>
				<Button>Feel Free to give a star on Github</Button>
			</header>
		</div>
	);
}
