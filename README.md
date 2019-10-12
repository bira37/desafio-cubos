# Desafio Cubos

Desafio do processo seletivo para vaga de programador backend júnior na Cubos

## Especificação

O desafio exigia a criação de uma API REST para facilitar o gerenciamento de horários de uma clínica. A API deveria ter como funcionalidade o cadastro de intervalos de horários para um determinado dia, intervalos de horário todos os dias e também para apenas alguns dias da semana. Deveria ser possível remover horários cadastrados e também listá-los, podendo filtrar os horários cadastrados num determinado intervalo de dias. Não foi permitido o uso de banco de dados.

## Armazenamento dos dados

Os dados da API foram armazenados em um arquivo JSON, encontrado no diretório 'data'. Caso este arquivo não exista, ele é criado após a primeira execução da API. Os horários armazenados foram divididos em três conjuntos: os horários diários, semanais e únicos. No primeiro conjunto são guardados todos os intervalos de horários disponíveis diariamente. O segundo conjunto guarda os intervalos disponíveis para cada dia da semana separadamente. Por fim, o último conjunto armazena os intervalos de horário de datas específicas. Cada intervalo de horário possui, além das informações exigidas, um identificador, referente à regra que o criou. Uma regra é definida como uma requisição de cadastro, que pode possuir mais de um intervalo de horário a ser cadastrado. Diferentes intervalos podem possuir o mesmo identificador, e isso implica que foram criados pela mesma regra.

## Organização do repositório

Este repositório possui diversos diretórios. O diretório 'data' contém o script que lida com a validação, formatação e gerenciamento dos dados. O arquivo JSON referente à base de dados também é armazenado neste mesmo diretório. O script responsável por criar os endpoints da API se encontra no diretório 'routes', enquanto o script que implementa as funcionalidades da API se encontra no diretório 'controllers'. O diretório 'tests' contém o script de teste da API e o diretório 'postman_collection' contém uma collection do Postman, com os exemplos de requisição exigidos pelo desafio.

## Instalando as dependências

Para instalar as dependências basta executar o comando abaixo:

```
npm install
```

## Executando os testes

Para executar os testes basta utilizar o comando:

```
npm test
```

Os testes criados visam garantir que as funcionalidades da API estão sendo executadas corretamente, além de verificar se requisições mal formatadas e conflitos de horários no cadastro retornam uma mensagem de erro.

## Executando a API 

Para executar a API, é necessário utilizar o seguinte comando:

```
node app.js
```

## Funcionalidades

As funcionalidades da API serão descritas nessa seção. Os exemplos mostrados podem ser encontrados no arquivo da coleção do Postman disponível no repositório, para que possam ser executados com o auxílio dessa ferramenta.

### Cadastro de uma regra 

**[POST]** http://127.0.0.1:3000/api/rules

Existem três formatos diferentes de corpo para essa requisição, dependendo do tipo de cadastro que deseja ser realizado. Para cadastrar uma regra diária, o corpo da requisição deve seguir o modelo do exemplo abaixo:

```
{
	"type": "daily",
	"intervals": [
		{
			"start": "09:30",
			"end": "10:10"
		}
	] 
}
```

A requisição acima cadastra o horário de 09:30 até às 10:10 para todos os dias. Para cadastrar uma regra semanal, o corpo deve seguir o exemplo abaixo:

```
{
	"type": "weekly",
	"days": [
		{
			"day": "Monday",
			"intervals": [
				{
					"start": "14:00",
					"end": "14:30"
				}
			]
		},
		{
			"day": "Wednesday",
			"intervals": [
				{
					"start": "14:00",
					"end": "14:30"
				}
			]
		}
	] 
}
```

Neste exemplo, é cadastrado o horário de 14:00 às 14:30 todas as segundas e quartas. Por fim, para cadastrar horários para um único dia, deve ser seguido o padrão do exemplo abaixo:

```
{
	"type": "once",
	"dates": [
		{
			"date": "25-06-2018",
			"intervals": [
				{
					"start": "08:30",
					"end": "09:20"
				},
				{
					"start": "10:30",
					"end": "11:00"
				}
			]
		}
	] 
}
```

Desta forma, estão sendo cadastrados os horários de 08:30 às 09:20 e de 10:30 às 11:00 para o dia 25/06/2018. Assim como no anterior onde mais de um dia da semana é passado, é possível passar mais de uma data para ser cadastrada. Além disso, é possível passar múltiplos intervalos de horário para cada dia da semana ou data na mesma requisição. O retorno de cada uma das requisições é um identificador único para a regra (requisição), como mostrado abaixo:

```
{
    "id": "8v4h13mtlk1mu9td7"
}
```

### Listando todas as regras 

**[GET]** http://127.0.0.1:3000/api/rules

Esta requisição lista todas as regras criadas, da forma como estão organizadas na base de dados. Um exemplo de retorno dessa requisição pode ser visto abaixo:

```
{
  "daily": [
    {
      "start": "09:30",
      "end": "10:10",
      "id": "8v4h13mtlk1mug171"
    }
  ],
  "weekly": {
    "Sunday": [],
    "Monday": [
      {
        "start": "14:00",
        "end": "14:30",
        "id": "8v4h13kxrk1mryxbw"
      }
    ],
    "Tuesday": [],
    "Wednesday": [
      {
        "start": "14:00",
        "end": "14:30",
        "id": "8v4h13kxrk1mryxbw"
      }
    ],
    "Thursday": [],
    "Friday": [],
    "Saturday": []
  },
  "once": {
    "25-06-2018": [
      {
        "start": "08:30",
        "end": "09:20",
        "id": "8v4h13kyak1mrz31j"
      },
      {
        "start": "10:30",
        "end": "11:00",
        "id": "8v4h13kyak1mrz31j"
      }
    ]
  }
}
```

### Listando horários disponíveis num determinado intervalo de datas

**[GET]** http://127.0.0.1:3000/api/rules?start={data_inicio}&end={data_fim}

Esta requisição lista os horários disponíveis, no formato exigido, entre duas datas. O campo {data_inicio} deve conter a data de início do intervalo e {data_fim} deve conter o final do intervalo. A data deve estar no formato dd-mm-yyyy. Um exemplo dessa requisição pode ser visto abaixo, onde é realizada uma requisição para http://127.0.0.1:3000/api/rules?start=24-06-2018&end=28-06-2018 :

```
[
    {
        "day": "24-06-2018",
        "intervals": [
            {
                "start": "09:30",
                "end": "10:10"
            }
        ]
    },
    {
        "day": "25-06-2018",
        "intervals": [
            {
                "start": "08:30",
                "end": "09:20"
            },
            {
                "start": "09:30",
                "end": "10:10"
            },
            {
                "start": "10:30",
                "end": "11:00"
            },
            {
                "start": "14:00",
                "end": "14:30"
            }
        ]
    },
    {
        "day": "26-06-2018",
        "intervals": [
            {
                "start": "09:30",
                "end": "10:10"
            }
        ]
    },
    {
        "day": "27-06-2018",
        "intervals": [
            {
                "start": "09:30",
                "end": "10:10"
            },
            {
                "start": "14:00",
                "end": "14:30"
            }
        ]
    },
    {
        "day": "28-06-2018",
        "intervals": [
            {
                "start": "09:30",
                "end": "10:10"
            }
        ]
    }
]
```

### Deletando uma regra cadastrada

**[DELETE]** http://127.0.0.1:3000/api/rules/{identificador}

Para realizar a remoção de uma regra, deve-se utilizar o identificador da regra recebido durante o cadastro, substituindo no campo {identificador}. Serão deletados todos os intervalos que foram adicionados durante o cadastro dessa regra. Uma requisição bem sucedida contém uma mensagem de sucesso, além da quantidade de intervalos deletados (igual ao número de intervalos adicionados durante o cadastro). Caso nenhum intervalo possua o identificador passado, será retornada a mesma mensagem de sucesso, porém o número de itens deletados será 0. Um exemplo pode ser visto abaixo:

```
{
    "message": "Rules successfully deleted",
    "deletedItems": 2
}
```

### Conflitos de intervalo

Durante o cadastro de uma regra, a API verifica se existe conflito de algum horário a ser adicionado com outros já cadastrados. Caso um conflito seja encontrado, é retornada uma mensagem de erro, sem a realização do cadastro. 
