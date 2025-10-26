/* ---------------------------------------------
   FUNCIONÁRIOS (EPG) + CARGO ATUAL (SEP) + FUNÇÃO (RHSEP opcional)
   + ESCOLARIDADE (S-2200) + ESTADO CIVIL (cod 2d + descrição)
   + MUNICÍPIO (via MUN) + ADMISSÃO (tipo + eSocial) + ADMISSAOVINCULO_DESC
   + LOTAÇÃO (via último SEP + LOT)
   --------------------------------------------- */
SELECT
  E.EMP_CODIGO,
  E.CODIGO                   AS EPG_CODIGO,
  E.NOME,
  E.NOMESOCIAL,
  E.CPF,
  E.PIS,
  E.DTNASCIMENTO,

  /* ---- SEXO por extenso ---- */
  CASE UPPER(TRIM(E.SEXO))
    WHEN 'M' THEN 'Masculino'
    WHEN 'F' THEN 'Feminino'
    ELSE NULL
  END                        AS SEXO,

  /* ---- ESTADO CIVIL: código 2 dígitos (01..05) ---- */
  CASE TRIM(E.ESTADOCIVIL)
    WHEN '1'  THEN '01'
    WHEN '01' THEN '01'
    WHEN '2'  THEN '02'
    WHEN '02' THEN '02'
    WHEN '3'  THEN '03'
    WHEN '03' THEN '03'
    WHEN '4'  THEN '04'
    WHEN '04' THEN '04'
    WHEN '5'  THEN '05'
    WHEN '05' THEN '05'
    ELSE CASE
           WHEN CHAR_LENGTH(TRIM(E.ESTADOCIVIL)) = 1
             THEN '0' || TRIM(E.ESTADOCIVIL)
           ELSE TRIM(E.ESTADOCIVIL)
         END
  END                        AS ESTADO_CIVIL_CODIGO,

  /* ---- ESTADO CIVIL: descrição (fora da lista => 'Outro') ---- */
  CASE TRIM(E.ESTADOCIVIL)
    WHEN '1'  THEN 'Solteiro'
    WHEN '01' THEN 'Solteiro'
    WHEN '2'  THEN 'Casado'
    WHEN '02' THEN 'Casado'
    WHEN '3'  THEN 'Divorciado'
    WHEN '03' THEN 'Divorciado'
    WHEN '4'  THEN 'Separado'
    WHEN '04' THEN 'Separado'
    WHEN '5'  THEN 'Viúvo'
    WHEN '05' THEN 'Viúvo'
    ELSE 'Outro'
  END                        AS ESTADO_CIVIL_DESCR,

  E.MAENOME,
  E.PAINOME,
  E.EMAIL,
  E.DDD,
  E.FONE,
  E.CELULAR,
  E.ENDLOGRADOURO,
  E.ENDNUMERO,
  E.ENDCOMPLEMENTO,
  E.BAIRRO,
  E.CEP,

  /* ---- MUNICÍPIO (UF + Código + Nome pelo join em MUN) ---- */
  E.MUN_UFD_SIGLA            AS UF_SIGLA,
  E.MUN_CODIGO               AS MUN_CODIGO,
  M.NOME                     AS MUNICIPIO_NOME,

  E.CTPSNUMERO,
  E.CTPSSERIE,
  E.CTPSDV,
  E.UFD_SIGLA_CTPS,
  E.CTPSDTEXPEDICAO,
  E.IDENTIDADENUMERO,
  E.IDENTIDADEORGAOEXPEDIDOR,
  E.IDENTIDADEDTEXPEDICAO,
  E.TITULO,
  E.ZONA,
  E.SECAO,

  /* ---- ADMISSÃO (datas e tipos) ---- */
  E.ADMISSAODATA,

  /* E.ADMISSAOTIPO => 1º Emprego(10), Reemprego(20), Reintegração(35) */
  E.ADMISSAOTIPO,
  CASE TRIM(E.ADMISSAOTIPO)
    WHEN '10' THEN '1º Emprego'
    WHEN '20' THEN 'Reemprego'
    WHEN '35' THEN 'Reintegração'
    ELSE NULL
  END AS ADMISSAOTIPO_DESC,

  /* E.ADMISSAOTIPOESOCIAL => descrição (1..7; senão 'Outro') */
  E.ADMISSAOTIPOESOCIAL,
  CASE TRIM(E.ADMISSAOTIPOESOCIAL)
    WHEN '1'  THEN 'Admissão'
    WHEN '01' THEN 'Admissão'
    WHEN '2'  THEN 'Transferência de empresa do mesmo grupo econômico ou transferência entre órgãos do mesmo Ente Federativo'
    WHEN '02' THEN 'Transferência de empresa do mesmo grupo econômico ou transferência entre órgãos do mesmo Ente Federativo'
    WHEN '3'  THEN 'Transferência de empresa consorciada ou de consórcio'
    WHEN '03' THEN 'Transferência de empresa consorciada ou de consórcio'
    WHEN '4'  THEN 'Transferência por motivo de sucessão, incorporação, cisão ou fusão'
    WHEN '04' THEN 'Transferência por motivo de sucessão, incorporação, cisão ou fusão'
    WHEN '5'  THEN 'Transferência do empregado doméstico para outro representante da mesma unidade familiar'
    WHEN '05' THEN 'Transferência do empregado doméstico para outro representante da mesma unidade familiar'
    WHEN '6'  THEN 'Mudança de CPF'
    WHEN '06' THEN 'Mudança de CPF'
    WHEN '7'  THEN 'Transferência quando a empresa sucedida é considerada inapta por inexistência de fato'
    WHEN '07' THEN 'Transferência quando a empresa sucedida é considerada inapta por inexistência de fato'
    ELSE 'Outro'
  END AS ADMISSAOTIPOESOCIAL_DESC,

  /* ---- ADMISSAO VINCULO: código + descrição ---- */
  E.ADMISSAOVINCULO,
  CASE TRIM(E.ADMISSAOVINCULO)
    WHEN '10' THEN 'Trabalhador Urbano, vinculado a empregador Pessoa Jurídica, por contrato de trabalho regido pela CLT, por prazo indeterminado'
    WHEN '15' THEN 'Trabalhador Urbano, vinculado a empregador Pessoa Física, por contrato de trabalho regido pela CLT, por prazo indeterminado'
    WHEN '20' THEN 'Trabalhador Rural, vinculado a empregador Pessoa Jurídica, por contrato de trabalho regido pela CLT, por prazo indeterminado'
    WHEN '25' THEN 'Trabalhador Rural, vinculado a empregador Pessoa Física, por contrato de trabalho regido pela CLT, por prazo indeterminado'
    WHEN '30' THEN 'Servidor regido pelo Regime Jurídico Único (Federal, Estadual e Municipal) e Militar'
    WHEN '35' THEN 'Servidor público não-efetivo (demissível ad nutum ou admitido por legislação especial, não regida pela CLT)'
    WHEN '40' THEN 'Trabalhador avulso (trabalho administrado pelo sindicato da categoria ou pelo órgão gestor de mão-de-obra)'
    WHEN '50' THEN 'Trabalhador temporário, regido pela Lei nº 6.019, de 03/01/1974'
    WHEN '55' THEN 'Menor aprendiz'
    WHEN '60' THEN 'Trabalhador Urbano, vinculado a empregador Pessoa Jurídica, por contrato de trabalho regido pela CLT, por tempo determinado ou obra certa'
    WHEN '65' THEN 'Trabalhador Urbano, vinculado a empregador Pessoa Física, por contrato de trabalho regido pela CLT, por tempo determinado ou obra certa'
    WHEN '70' THEN 'Trabalhador Rural, vinculado a empregador Pessoa Jurídica, por contrato de trabalho regido pela Lei nº 5.889/73, por tempo determinado'
    WHEN '75' THEN 'Trabalhador Rural, vinculado a empregador Pessoa Física, por contrato de trabalho regido pela Lei nº 5.889/73, por tempo determinado'
    WHEN '79' THEN 'Aposentadoria especial'
    WHEN '80' THEN 'Diretor, sem vínculo empregatício, para o qual a empresa/entidade tenha optado por recolhimento do FGTS'
    WHEN '90' THEN 'Contrato de trabalho por prazo determinado, regido pela Lei nº 9.601, de 21/01/1998'
    ELSE 'Outro'
  END AS ADMISSAOVINCULO_DESC,

  E.DTRESCISAO               AS DEMISSAO_DATA,

  /* ---- PCD ---- */
  E.TEMDEFICIENCIA,
  E.PREENCHECOTADEFICIENCIA,
  E.DEFICIENCIAFISICA,
  E.DEFICIENCIAVISUAL,
  E.DEFICIENCIAAUDITIVA,
  E.DEFICIENCIAMENTAL,
  E.DEFICIENCIAINTELECTUAL,

  /* ---- ESCOLARIDADE (código + descrição S-2200) ---- */
  E.GRAUINSTRUCAO                                AS ESCOLARIDADE_CODIGO,
  CASE TRIM(E.GRAUINSTRUCAO)
    WHEN '01' THEN 'Analfabeto, inclusive o que, embora tenha recebido instrução, não se alfabetizou'
    WHEN '1'  THEN 'Analfabeto, inclusive o que, embora tenha recebido instrução, não se alfabetizou'
    WHEN '02' THEN 'Até o 5º ano incompleto do ensino fundamental (antiga 4ª série) ou que se tenha alfabetizado sem ter frequentado escola regular'
    WHEN '2'  THEN 'Até o 5º ano incompleto do ensino fundamental (antiga 4ª série) ou que se tenha alfabetizado sem ter frequentado escola regular'
    WHEN '03' THEN '5º ano completo do ensino fundamental'
    WHEN '3'  THEN '5º ano completo do ensino fundamental'
    WHEN '04' THEN 'Do 6º ao 9º ano do ensino fundamental incompleto (antiga 5ª a 8ª série)'
    WHEN '4'  THEN 'Do 6º ao 9º ano do ensino fundamental incompleto (antiga 5ª a 8ª série)'
    WHEN '05' THEN 'Ensino fundamental completo'
    WHEN '5'  THEN 'Ensino fundamental completo'
    WHEN '06' THEN 'Ensino médio incompleto'
    WHEN '6'  THEN 'Ensino médio incompleto'
    WHEN '07' THEN 'Ensino médio completo'
    WHEN '7'  THEN 'Ensino médio completo'
    WHEN '08' THEN 'Educação superior incompleta'
    WHEN '8'  THEN 'Educação superior incompleta'
    WHEN '09' THEN 'Educação superior completa'
    WHEN '9'  THEN 'Educação superior completa'
    WHEN '10' THEN 'Pós-graduação completa'
    WHEN '11' THEN 'Mestrado completo'
    WHEN '12' THEN 'Doutorado completo'
    ELSE NULL
  END                                             AS ESCOLARIDADE_DESCR,

  /* ---- CARGO vigente: último SEP por data ---- */
  (SELECT FIRST 1 S.CAR_CODIGO
     FROM SEP S
    WHERE S.EMP_CODIGO = E.EMP_CODIGO
      AND S.EPG_CODIGO = E.CODIGO
    ORDER BY S.DATA DESC)                         AS CARGO_CODIGO,

  (SELECT FIRST 1 C.NOME
     FROM SEP S
     JOIN CAR C
       ON C.EMP_CODIGO = S.EMP_CODIGO
      AND C.CODIGO     = S.CAR_CODIGO
    WHERE S.EMP_CODIGO = E.EMP_CODIGO
      AND S.EPG_CODIGO = E.CODIGO
    ORDER BY S.DATA DESC)                         AS CARGO_DESCR,

  /* ---- FUNÇÃO: último registro do RHSEP, se houver ---- */
  (SELECT FIRST 1 R.FUN_CODIGO
     FROM RHSEP R
    WHERE R.EMP_CODIGO = E.EMP_CODIGO
      AND R.EPG_CODIGO = E.CODIGO
    ORDER BY R.DATA DESC)                         AS FUNCAO_CODIGO,

  (SELECT FIRST 1 F.NOME
     FROM RHSEP R
     JOIN FUN F
       ON F.EMP_CODIGO = R.EMP_CODIGO
      AND F.CODIGO     = R.FUN_CODIGO
    WHERE R.EMP_CODIGO = E.EMP_CODIGO
      AND R.EPG_CODIGO = E.CODIGO
    ORDER BY R.DATA DESC)                         AS FUNCAO_DESCR,

  /* ---- LOTAÇÃO: último SEP por data + descrição (LOT) ---- */
  (SELECT FIRST 1 S.LOT_CODIGO
     FROM SEP S
    WHERE S.EMP_CODIGO = E.EMP_CODIGO
      AND S.EPG_CODIGO = E.CODIGO
    ORDER BY S.DATA DESC)                         AS LOTACAO_CODIGO,

  (SELECT FIRST 1 L.NOME
     FROM SEP S
     JOIN LOT L
       ON L.EMP_Codigo = S.EMP_CODIGO
      AND L.Codigo     = S.LOT_CODIGO
    WHERE S.EMP_CODIGO = E.EMP_CODIGO
      AND S.EPG_CODIGO = E.CODIGO
    ORDER BY S.DATA DESC)                         AS LOTACAO_NOME

FROM EPG E
LEFT JOIN MUN M
       ON M.UFD_SIGLA = E.MUN_UFD_SIGLA
      AND M.CODIGO    = E.MUN_CODIGO
WHERE
  E.EMP_CODIGO = '0002';