-- CreateTable
CREATE TABLE "t_auth" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "provider_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "client_ip" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_users" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_posts" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "image_urls" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_likes" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "post_id" INTEGER NOT NULL,
    "author_id" TEXT NOT NULL,
    "root_comment_id" INTEGER,
    "parent_comment_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_auth_user_id_key" ON "t_auth"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_auth_email_key" ON "t_auth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "t_auth_provider_provider_id_key" ON "t_auth"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_sessions_refresh_token_key" ON "t_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "t_sessions_userId_idx" ON "t_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "t_users_nickname_key" ON "t_users"("nickname");

-- CreateIndex
CREATE INDEX "t_posts_author_id_idx" ON "t_posts"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_likes_post_id_user_id_key" ON "t_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "t_comments_post_id_idx" ON "t_comments"("post_id");

-- CreateIndex
CREATE INDEX "t_comments_root_comment_id_idx" ON "t_comments"("root_comment_id");

-- AddForeignKey
ALTER TABLE "t_auth" ADD CONSTRAINT "t_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_sessions" ADD CONSTRAINT "t_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_posts" ADD CONSTRAINT "t_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_likes" ADD CONSTRAINT "t_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_likes" ADD CONSTRAINT "t_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "t_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_comments" ADD CONSTRAINT "t_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_comments" ADD CONSTRAINT "t_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "t_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_comments" ADD CONSTRAINT "t_comments_root_comment_id_fkey" FOREIGN KEY ("root_comment_id") REFERENCES "t_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_comments" ADD CONSTRAINT "t_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "t_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
