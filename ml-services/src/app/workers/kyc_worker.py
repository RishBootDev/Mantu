import asyncio

from app.core.config import get_settings


async def run() -> None:
    settings = get_settings()
           

    print(
        "KYC worker scaffold. Configure consumer for "
        f"{settings.kafka_kyc_topic!r}."
    )


if __name__ == "__main__":
    asyncio.run(run())
