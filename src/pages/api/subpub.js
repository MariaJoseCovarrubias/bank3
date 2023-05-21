import prisma from "prisma/instance";


export default async function handler(req, res) {
  const method = req.method;
  if (method === "POST") {
    const data = atob(req.body.message.data);

    const type = parseInt(data.slice(0, 4));
    const id = parseInt(data.slice(4, 4 + 10));
    const bank_origin = parseInt(data.slice(14, 14 + 7));
    const acc_origin = parseInt(data.slice(21, 21 + 10));
    const bank_dest = parseInt(data.slice(31, 31 + 7));
    const acc_dest = parseInt(data.slice(38, 38 + 10));
    const money = parseInt(data.slice(48, 48 + 16));
    const date = req.body.message.publishTime;



    const bank_info = await prisma.bank_info.create({
      data: {
        id,
        type,
        bank_origin,
        acc_origin,
        bank_dest,
        acc_dest,
        money,
        date,
      },
    });

    console.log(bank_info);

    res.status(200).json({ method: method });
  } else {
    res.status(200).json({ method: method });
  }
  // console.log(info);
}
