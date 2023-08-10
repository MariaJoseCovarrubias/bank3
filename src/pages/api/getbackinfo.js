import prisma from "prisma/instance";

export default async function handler(req, res) {
  try {
    // Use Prisma Client to fetch data from the database
    const bank_info = await prisma.bank_info.findMany();

    // Return the fetched data as the response
    res.status(200).json(bank_info);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
}