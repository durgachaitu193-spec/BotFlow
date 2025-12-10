"use server";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

export async function uploadFileToPinata(formData: FormData) {
  try {
    if (!PINATA_JWT) {
      throw new Error("Pinata JWT not found");
    }

    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file found in FormData");
    }

    const data = new FormData();
    data.append("file", file);
    data.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
    data.append("pinataMetadata", JSON.stringify({ name: file.name }));

    const request = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: data,
      },
    );

    if (!request.ok) {
      const errorText = await request.text();
      console.error("Pinata API Error:", errorText);
      throw new Error(`Pinata upload failed: ${request.statusText}`);
    }

    const response = await request.json();
    return {
      ...response,
      cid: response.IpfsHash,
      id: response.IpfsHash,
      url: `${GATEWAY_URL}/ipfs/${response.IpfsHash}`,
    };
  } catch (error) {
    console.error("Error uploading file to Pinata:", error);
    throw new Error("IPFS upload failed");
  }
}

export async function uploadJSONToPinata(jsonData: unknown) {
  try {
    if (!PINATA_JWT) {
      throw new Error("Pinata JWT not found");
    }

    console.log("Uploading JSON to Pinata...", JSON.stringify(jsonData));

    const request = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: jsonData,
          pinataOptions: { cidVersion: 1 },
          pinataMetadata: { name: "metadata.json" },
        }),
      },
    );

    if (!request.ok) {
      const errorText = await request.text();
      console.error("Pinata API Error:", errorText);
      throw new Error(`Pinata upload failed: ${request.statusText}`);
    }

    const response = await request.json();
    console.log("Upload successful:", response);
    return {
      ...response,
      cid: response.IpfsHash,
    };
  } catch (error) {
    console.error("Error uploading JSON to Pinata:", error);
    let errorMessage = "IPFS upload failed";
    if (error instanceof Error) {
      errorMessage = `IPFS upload failed: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}
