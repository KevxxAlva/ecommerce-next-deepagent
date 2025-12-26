import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const productImages = {
  laptop_moderna: "https://images.unsplash.com/photo-1600195075831-b4d885c54371?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D",
  smartphone_premium: "https://images.pexels.com/photos/25849099/pexels-photo-25849099.png?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  auriculares_bluetooth: "https://www.shutterstock.com/image-photo/black-wireless-overear-headphones-cushioned-600nw-2712106067.jpg",
  camiseta_basica: "https://halsey44.com/wp-content/uploads/2022/05/Halsey44-PI3039-Liquid-Pima-Crew-Neck-Tee-front-flat-Cobalt_.jpg",
  jeans_clasicos: "https://media.istockphoto.com/id/1281304280/photo/folded-blue-jeans-on-a-white-background-modern-casual-clothing-flat-lay-copy-space.jpg?s=612x612&w=0&k=20&c=nSMI2abaVovzkH1n0eXeJYCkrtI-6QcD_V7OVUz4zS4=",
  zapatillas_deportivas: "https://media.istockphoto.com/id/1193036915/photo/white-sneaker-with-blue-accents-on-a-white-background-sports-shoes-for-an-active-lifestyle.jpg?s=1024x1024&w=is&k=20&c=UJJxgZKCjNrNl1_n_3t4D--dMC8s58XDiBael4h0CvY=",
  lampara_moderna: "https://thumbs.dreamstime.com/b/foldable-rechargeable-table-lamp-minimalist-design-isolated-white-background-product-focused-visuals-368399774.jpg",
  silla_oficina: "https://cdnimg.webstaurantstore.com/images/products/large/195476/694089.jpg",
  mesa_madera: "https://media.istockphoto.com/id/578085396/photo/empty-wooden-table-top-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=dRnO45OkkGoZJ2EbIEkcTPsDZFoIvaKZfD2Ap2DPlTA=",
  balon_futbol: "https://media.istockphoto.com/id/1064319716/photo/soccer-ball-isolated-on-white-background-black-and-white-football-ball.jpg?s=612x612&w=is&k=20&c=tBTtHCmkrx1fxlYJRFXnt22pwe_qUlaav_ef6uxg21s=",
  raqueta_tenis: "https://media.istockphoto.com/id/1505246595/photo/tennis-racket-isolated-on-a-white-background.jpg?s=612x612&w=0&k=20&c=1wx3981ZQJEG1KHELJGoN6ppzs3Y8M1kF42gvrGQWKo=",
  bicicleta_montana: "https://media.istockphoto.com/id/473271822/photo/blue-mountain-bike.jpg?s=612x612&w=0&k=20&c=b4i4mDgt0Abbao9xkyCyCfuU18wihU4Q6UGMD0wZFE8="
};

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create categories
  console.log('Creating categories...');
  const electronica = await prisma.category.upsert({
    where: { slug: 'electronica' },
    update: {},
    create: {
      name: 'Electrónica',
      slug: 'electronica',
      description: 'Dispositivos electrónicos y tecnología de última generación',
    },
  });

  const ropa = await prisma.category.upsert({
    where: { slug: 'ropa' },
    update: {},
    create: {
      name: 'Ropa',
      slug: 'ropa',
      description: 'Moda y vestimenta para todas las ocasiones',
    },
  });

  const hogar = await prisma.category.upsert({
    where: { slug: 'hogar' },
    update: {},
    create: {
      name: 'Hogar',
      slug: 'hogar',
      description: 'Muebles y artículos para el hogar',
    },
  });

  const deportes = await prisma.category.upsert({
    where: { slug: 'deportes' },
    update: {},
    create: {
      name: 'Deportes',
      slug: 'deportes',
      description: 'Equipamiento deportivo y fitness',
    },
  });
  console.log('✅ Categories created');

  // Create products
  console.log('Creating products...');

  // Electrónica
  await prisma.product.upsert({
    where: { id: 'laptop-001' },
    update: {},
    create: {
      id: 'laptop-001',
      name: 'Laptop Profesional Ultra',
      description: 'Laptop de última generación con procesador de alta velocidad, 16GB RAM y pantalla Full HD de 15.6 pulgadas. Ideal para profesionales y diseñadores.',
      price: 899.99,
      stock: 15,
      categoryId: electronica.id,
      images: [productImages.laptop_moderna],
    },
  });

  await prisma.product.upsert({
    where: { id: 'smartphone-001' },
    update: {},
    create: {
      id: 'smartphone-001',
      name: 'Smartphone Premium X',
      description: 'Smartphone de última generación con cámara de 48MP, pantalla AMOLED de 6.5 pulgadas y batería de larga duración. 5G habilitado.',
      price: 699.99,
      stock: 25,
      categoryId: electronica.id,
      images: [productImages.smartphone_premium],
    },
  });

  await prisma.product.upsert({
    where: { id: 'auriculares-001' },
    update: {},
    create: {
      id: 'auriculares-001',
      name: 'Auriculares Bluetooth Pro',
      description: 'Auriculares inalámbricos con cancelación de ruido activa, sonido Hi-Fi y hasta 30 horas de batería. Perfectos para música y trabajo.',
      price: 149.99,
      stock: 40,
      categoryId: electronica.id,
      images: [productImages.auriculares_bluetooth],
    },
  });

  // Ropa
  await prisma.product.upsert({
    where: { id: 'camiseta-001' },
    update: {},
    create: {
      id: 'camiseta-001',
      name: 'Camiseta Básica Premium',
      description: 'Camiseta de algodón 100% premium, suave al tacto y de corte moderno. Disponible en azul. Perfecta para uso diario.',
      price: 24.99,
      stock: 100,
      categoryId: ropa.id,
      images: [productImages.camiseta_basica],
    },
  });

  await prisma.product.upsert({
    where: { id: 'jeans-001' },
    update: {},
    create: {
      id: 'jeans-001',
      name: 'Jeans Clásicos Comfort',
      description: 'Jeans de corte clásico con tela elastizada para máxima comodidad. Diseño atemporal que combina con todo.',
      price: 49.99,
      stock: 60,
      categoryId: ropa.id,
      images: [productImages.jeans_clasicos],
    },
  });

  await prisma.product.upsert({
    where: { id: 'zapatillas-001' },
    update: {},
    create: {
      id: 'zapatillas-001',
      name: 'Zapatillas Deportivas Air',
      description: 'Zapatillas deportivas con suela de amortiguación avanzada y diseño ligero. Ideales para correr y entrenar.',
      price: 79.99,
      stock: 50,
      categoryId: ropa.id,
      images: [productImages.zapatillas_deportivas],
    },
  });

  // Hogar
  await prisma.product.upsert({
    where: { id: 'lampara-001' },
    update: {},
    create: {
      id: 'lampara-001',
      name: 'Lámpara de Mesa Moderna',
      description: 'Lámpara LED recargable con diseño minimalista. Tres niveles de brillo ajustables. Perfecta para escritorio o mesita de noche.',
      price: 39.99,
      stock: 35,
      categoryId: hogar.id,
      images: [productImages.lampara_moderna],
    },
  });

  await prisma.product.upsert({
    where: { id: 'silla-001' },
    update: {},
    create: {
      id: 'silla-001',
      name: 'Silla de Oficina Ergonómica',
      description: 'Silla ergonómica con respaldo ajustable, reposabrazos y soporte lumbar. Diseñada para largas jornadas de trabajo.',
      price: 199.99,
      stock: 20,
      categoryId: hogar.id,
      images: [productImages.silla_oficina],
    },
  });

  await prisma.product.upsert({
    where: { id: 'mesa-001' },
    update: {},
    create: {
      id: 'mesa-001',
      name: 'Mesa de Madera Natural',
      description: 'Mesa de madera maciza con acabado natural. Diseño moderno y minimalista. Ideal para comedor o escritorio.',
      price: 299.99,
      stock: 12,
      categoryId: hogar.id,
      images: [productImages.mesa_madera],
    },
  });

  // Deportes
  await prisma.product.upsert({
    where: { id: 'balon-001' },
    update: {},
    create: {
      id: 'balon-001',
      name: 'Balón de Fútbol Profesional',
      description: 'Balón oficial de fútbol con diseño clásico. Construcción de alta calidad para un juego óptimo.',
      price: 29.99,
      stock: 45,
      categoryId: deportes.id,
      images: [productImages.balon_futbol],
    },
  });

  await prisma.product.upsert({
    where: { id: 'raqueta-001' },
    update: {},
    create: {
      id: 'raqueta-001',
      name: 'Raqueta de Tenis Pro',
      description: 'Raqueta profesional de tenis con marco de grafito. Balance perfecto entre potencia y control.',
      price: 89.99,
      stock: 18,
      categoryId: deportes.id,
      images: [productImages.raqueta_tenis],
    },
  });

  await prisma.product.upsert({
    where: { id: 'bicicleta-001' },
    update: {},
    create: {
      id: 'bicicleta-001',
      name: 'Bicicleta de Montaña X-Trail',
      description: 'Bicicleta de montaña con suspensión completa, 21 velocidades y cuadro de aluminio ligero. Lista para cualquier terreno.',
      price: 499.99,
      stock: 8,
      categoryId: deportes.id,
      images: [productImages.bicicleta_montana],
    },
  });

  console.log('✅ Products created');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
