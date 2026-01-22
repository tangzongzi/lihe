import { NextResponse } from "next/server"
import { runMigrations, isDatabaseInitialized } from "@/storage/database"

export async function GET() {
  try {
    // 检查是否已初始化
    const isInitialized = await isDatabaseInitialized()

    if (isInitialized) {
      return NextResponse.json({
        success: true,
        message: "数据库已初始化",
        alreadyInitialized: true,
      })
    }

    // 运行迁移
    await runMigrations()

    return NextResponse.json({
      success: true,
      message: "数据库初始化成功",
      alreadyInitialized: false,
    })
  } catch (error) {
    console.error("数据库初始化失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}
