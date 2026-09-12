import { success } from "zod";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";

const booking = async () => {
  const bkashIdToken = await getBkashIdToken();
  if (!bkashIdToken) {
    throw new Error("bkash access token not found");
  }
  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        agreementID: "TokenizedMerchant01L3IKB6H1565072174986",
        mode: "0011",
        payerReference: "01723888888",
        callbackURL: `${config.bkash_callback_url}/project-booking/payment/callback`,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: "1200",
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: "Inv0124",
      }),
    },
  );
  const bkashCreatePaymentResult = bkashCreatePaymentResponse.json();

  return bkashCreatePaymentResult;
};

const bookingCallback = async () => {
  return {
    success: true,
  };
};

export const bookingServices = { booking, bookingCallback };
