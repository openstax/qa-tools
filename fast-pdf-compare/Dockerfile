FROM openstax/python3-base:20220614.214431 as install-poppler
RUN apt-get update \
    && apt-get install -y poppler-utils \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
WORKDIR /app


FROM openstax/python3-poetry:20230310.212344 as builder
WORKDIR /app
COPY pyproject.toml poetry.lock ./
COPY fast_pdf_compare ./fast_pdf_compare
RUN poetry build -f wheel


FROM install-poppler as runner
COPY --from=builder /app/dist /app/dist
RUN pip install /app/dist/*.whl && rm -rf /app/dist
ENTRYPOINT ["fast_pdf_compare"]
