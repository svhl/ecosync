# EcoSync

Connecting industries to optimize resource usage, reduce waste, and promote circular economy principles

## About EcoSync

This project was developed in 36 hours during HackS'US Edition IV conducted by Rajagiri School of Engineering and Technology, Kerala. It addresses the theme of "Responsible Consumption and Production," an aspect of the United Nations Sustainable Development Goals.

## Features

🏭 **Small to medium-scale industries** can set up or expand quickly and economically

💵 **Buy and sell** raw materials, by-products, and used equipment

♻️ **Circular economy** where industries can act as both buyers and sellers, reducing waste and maximizing resource use

🤝 **View and collaborate** with nearby industries to reduce logistics costs

✅ **Track orders** for faster and easier communication between buyers and sellers

👍 Industries can earn a **badge of sustainability**, boosting their credibility and consumer trust

## Tech stack

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

## Hosting

The frontend and Node.js are hosted on [Render](https://render.com/), and the MySQL database is hosted on [Aiven](https://aiven.io/).

The site can be viewed at [ecosync-jgwp.onrender.com](https://ecosync-jgwp.onrender.com).

> [!IMPORTANT]
> The site may take ~1 min to load.
>
> Refer the database below for login credentials.

### Database

#### Admins table

| username | password  |
|----------|-----------|
| admin    | admin123  |

#### Users table

| username | password | industry       | map                                  | contact      | type             | approved | sell |
|----------|----------|----------------|--------------------------------------|--------------|------------------|----------|------|
| Merriboy | 123      | Merriboy       | 8.685475983345134,76.95739757269622  | 8219323910   | Dairy Industry   | yes      | yes  |
| Milma    | 123654   | Milma          | 12.56457223807264,76.42089843750001  | 345678975    | Dairy Industry   | yes      | yes  |

#### Seller Listing table

| list_id | username | product_name | quantity | type        |
|---------|----------|--------------|----------|-------------|
| 8       | Milma    | Milk         | 1000     | rawMaterial |
| 10      | Merriboy | Cows         | 50       | rawMaterial |
| 11      | Milma    | Peda         | 2000     | rawMaterial |
| 12      | Milma    | Mixer        | 200      | equipment   |
| 13      | Milma    | Whey         | 50       | byProduct   |
| 14      | Merriboy | Lactose      | 30       | byProduct   |
| 15      | Merriboy | Sugar        | 200      | byProduct   |
| 16      | Milma    | Umbrella     | 500      | equipment   |

## How to use

### Prerequisites
[Node.js](https://nodejs.org/en/download) and [MySQL](https://dev.mysql.com/downloads/mysql/) should be installed. Configure MySQL username as `root` and password as `password`. Run the commands within [database.txt](https://github.com/svhl/ecosync/blob/main/database.txt) in MySQL. Then, clone the repo and install the required modules.

```
git clone https://github.com/svhl/ecosync
cd ecosync
npm install
```

### Running

Start the server by running

```
node server.js
```

## About the devs

Darsan Prasad | Frontend | [GitHub](https://github.com/darshan-jpeg)

Deril Jose Thirunilath | Backend | [GitHub](https://github.com/deriljose)

Dev Sebastian Joseph | Frontend | [GitHub](https://github.com/dev-sebastian-joseph)

Geevar Saji Kuriakose | Frontend | [GitHub](https://github.com/Geevar12)

Jesel Gibi George | Frontend | [GitHub](https://github.com/JESEL7)

Muhammed S. Suhail | Fullstack | [GitHub](https://github.com/svhl)
