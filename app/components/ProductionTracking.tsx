"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import FacebookPixel from "./FacebookPixel";
import PublicClarity from "./PublicClarity";
import PurchaseTracking from "./PurchaseTracking";
import CheckoutAnalyticsContext from "./CheckoutAnalyticsContext";
import { isProductionTrackingAllowed } from "../../lib/tracking-environment";

export default function ProductionTracking() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(isProductionTrackingAllowed()); }, []);
  if (!enabled) return null;
  return (
    <>
        <FacebookPixel />
<Script id="microsoft-uet" strategy="afterInteractive">
  {`
    (function(w,d,t,u,o){
      w[u]=w[u]||[],o.ts=(new Date).getTime();
      var n=d.createElement(t);
      n.src="https://bat.bing.com/bat.js?ti="+o.ti+("uetq"!=u?"&q="+u:"");
      n.async=1;
      n.onload=n.onreadystatechange=function(){
        var s=this.readyState;
        s&&"loaded"!=s&&"complete"!=s||
        (o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad"),
        n.onload=n.onreadystatechange=null)
      };
      var i=d.getElementsByTagName(t)[0];
      i.parentNode.insertBefore(n,i)
    })(window,document,"script","uetq",{
      ti:"97271377",
      enableAutoSpaTracking:true
    });
  `}
</Script>
        <PublicClarity />
      <GoogleAnalytics gaId="G-SLX50BGDQK" />
      <PurchaseTracking />
      <CheckoutAnalyticsContext />
    </>
  );
}
