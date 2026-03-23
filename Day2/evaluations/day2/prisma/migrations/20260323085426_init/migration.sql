-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Livre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "annee" INTEGER,
    "genre" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Emprunt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "livreId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateEmprunt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRetour" DATETIME,
    CONSTRAINT "Emprunt_livreId_fkey" FOREIGN KEY ("livreId") REFERENCES "Livre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprunt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
